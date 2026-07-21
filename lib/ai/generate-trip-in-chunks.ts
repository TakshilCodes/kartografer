import {
  extractJsonFromAiText,
  type GenerateTripInput,
} from "@/lib/ai/ai-client";
import { generateTextWithGemini } from "@/lib/ai/gemini.provider";
import { buildGenerateTripDaysChunkPrompt } from "@/lib/ai/prompts/generate-trip-days-chunk.prompt";
import {
  generatedTripChunkSchema,
  generatedTripSchema,
  type GeneratedTrip,
  type GeneratedTripDay,
} from "@/lib/ai/schemas/generated-trip.schema";

const DAYS_PER_CHUNK = 3;
const CHUNK_GENERATION_CONCURRENCY = 1;
const MAX_ATTEMPTS_PER_MODEL = 1;
const MAX_REQUESTS_PER_CHUNK = 2;
const MAX_SCHEMA_REPAIR_ATTEMPTS = 2;
const MAX_CHUNK_API_ATTEMPTS = 3;

const chunkGenerationConfig = {
  responseMimeType: "application/json",
  temperature: 0.35,
  maxOutputTokens: 8192,
};

export const longTripGenerationPolicy = {
  daysPerChunk: DAYS_PER_CHUNK,
  concurrency: CHUNK_GENERATION_CONCURRENCY,
  maxAttemptsPerModel: MAX_ATTEMPTS_PER_MODEL,
  maxRequestsPerChunk: MAX_REQUESTS_PER_CHUNK,
  schemaRepairAttempts: MAX_SCHEMA_REPAIR_ATTEMPTS,
  apiAttempts: MAX_CHUNK_API_ATTEMPTS,
} as const;

type DayRange = {
  startDay: number;
  endDay: number;
};

export function createDayRanges(daysCount: number): DayRange[] {
  const ranges: DayRange[] = [];

  for (let startDay = 1; startDay <= daysCount; startDay += DAYS_PER_CHUNK) {
    ranges.push({
      startDay,
      endDay: Math.min(startDay + DAYS_PER_CHUNK - 1, daysCount),
    });
  }

  return ranges;
}

function getShortPlaceName(place: string) {
  return place.split(",")[0]?.trim() || place.trim();
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;

  return value.slice(0, maxLength - 1).trimEnd();
}

function createTripTitle(input: GenerateTripInput) {
  const destination = getShortPlaceName(input.toPlace);

  return truncateText(`${input.daysCount}-Day ${destination} Trip`, 160);
}

function createTripSummary(input: GenerateTripInput) {
  const budgetText =
    input.budgetAmount && input.budgetAmount > 0
      ? ` with a ${input.currency} ${input.budgetAmount} budget`
      : "";

  return truncateText(
    `A ${input.daysCount}-day trip from ${input.fromPlace} to ${input.toPlace} for ${input.peopleCount} people${budgetText}, planned with a ${input.travelPace.toLowerCase()} pace.`,
    1500,
  );
}

function getSortedDays(days: GeneratedTripDay[]) {
  return [...days].sort((firstDay, secondDay) => {
    return firstDay.dayNumber - secondDay.dayNumber;
  });
}

function validateChunkDays({
  days,
  range,
}: {
  days: GeneratedTripDay[];
  range: DayRange;
}) {
  const expectedCount = range.endDay - range.startDay + 1;
  const sortedDays = getSortedDays(days);

  if (sortedDays.length !== expectedCount) {
    throw new Error(
      `AI generated ${sortedDays.length} days for days ${range.startDay}-${range.endDay}, but ${expectedCount} days were expected.`,
    );
  }

  for (let index = 0; index < expectedCount; index++) {
    const expectedDayNumber = range.startDay + index;
    const actualDayNumber = sortedDays[index]?.dayNumber;

    if (actualDayNumber !== expectedDayNumber) {
      throw new Error(
        `AI generated invalid day numbers for days ${range.startDay}-${range.endDay}. Expected day ${expectedDayNumber}, got ${actualDayNumber ?? "nothing"}.`,
      );
    }
  }

  return sortedDays;
}

function validateCompleteTripDays({
  days,
  daysCount,
}: {
  days: GeneratedTripDay[];
  daysCount: number;
}) {
  const sortedDays = getSortedDays(days);

  if (sortedDays.length !== daysCount) {
    throw new Error(
      `AI generated ${sortedDays.length} total days, but ${daysCount} days were expected.`,
    );
  }

  for (let index = 0; index < daysCount; index++) {
    const expectedDayNumber = index + 1;
    const actualDayNumber = sortedDays[index]?.dayNumber;

    if (actualDayNumber !== expectedDayNumber) {
      throw new Error(
        `AI generated an incomplete itinerary. Expected day ${expectedDayNumber}, got ${actualDayNumber ?? "nothing"}.`,
      );
    }
  }

  return sortedDays;
}

function getErrorStatus(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error.status;
  }

  return null;
}

function isRetryableChunkError(error: unknown) {
  const status = getErrorStatus(error);
  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

function getChunkRetryDelay(apiAttempt: number) {
  return apiAttempt * 2500;
}

function getLongTripGenerationModels() {
  return [
    process.env.GEMINI_FALLBACK_MODEL ?? "gemini-2.5-flash-lite",
    process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  ];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function createChunkGenerationError({
  error,
  range,
}: {
  error: unknown;
  range: DayRange;
}) {
  const message = error instanceof Error ? error.message : "Unknown AI error.";
  const chunkError = new Error(
    `AI failed while generating days ${range.startDay}-${range.endDay}: ${message}`,
  );
  const status = getErrorStatus(error);

  if (status !== null) {
    (chunkError as Error & { status: number }).status = status;
  }

  return chunkError;
}

async function generateDaysChunk({
  input,
  range,
}: {
  input: GenerateTripInput;
  range: DayRange;
}) {
  const startedAt = Date.now();
  const rangeLabel = `${range.startDay}-${range.endDay}`;
  const prompt = buildGenerateTripDaysChunkPrompt({
    ...input,
    startDay: range.startDay,
    endDay: range.endDay,
  });

  console.info("AI_TRIP_CHUNK_GENERATION_STARTED", {
    range: rangeLabel,
    totalDays: input.daysCount,
  });

  for (
    let apiAttempt = 1;
    apiAttempt <= MAX_CHUNK_API_ATTEMPTS;
    apiAttempt += 1
  ) {
    try {
      for (
        let schemaAttempt = 1;
        schemaAttempt <= MAX_SCHEMA_REPAIR_ATTEMPTS;
        schemaAttempt += 1
      ) {
        const result = await generateTextWithGemini({
          prompt,
          config: chunkGenerationConfig,
          models: getLongTripGenerationModels(),
          maxAttemptsPerModel: MAX_ATTEMPTS_PER_MODEL,
          maxRequests: MAX_REQUESTS_PER_CHUNK,
        });

        try {
          const json = extractJsonFromAiText(result.text);
          const parsedChunk = generatedTripChunkSchema.safeParse(json);

          if (!parsedChunk.success) {
            console.error("AI_TRIP_CHUNK_SCHEMA_INVALID", {
              range: rangeLabel,
              apiAttempt,
              schemaAttempt,
              issues: parsedChunk.error.issues
                .slice(0, 3)
                .map((issue) => issue.path.join(".")),
            });
            throw new Error("AI chunk did not match the required schema.");
          }

          const days = validateChunkDays({
            days: parsedChunk.data.days,
            range,
          });

          console.info("AI_TRIP_CHUNK_GENERATION_SUCCEEDED", {
            range: rangeLabel,
            durationMs: Date.now() - startedAt,
            model: result.modelUsed,
            finishReason: result.finishReason,
            apiAttempt,
            schemaAttempt,
          });

          return days;
        } catch (schemaError) {
          if (schemaAttempt === MAX_SCHEMA_REPAIR_ATTEMPTS) {
            throw schemaError;
          }

          console.warn("AI_TRIP_CHUNK_SCHEMA_RETRY", {
            range: rangeLabel,
            apiAttempt,
            schemaAttempt,
          });
        }
      }
    } catch (error) {
      const shouldRetry =
        apiAttempt < MAX_CHUNK_API_ATTEMPTS && isRetryableChunkError(error);

      if (!shouldRetry) {
        console.error("AI_TRIP_CHUNK_GENERATION_FAILED", {
          range: rangeLabel,
          durationMs: Date.now() - startedAt,
          apiAttempt,
          status: getErrorStatus(error),
          message: error instanceof Error ? error.message : "Unknown AI error.",
        });
        throw createChunkGenerationError({ error, range });
      }

      const retryDelayMs = getChunkRetryDelay(apiAttempt);
      console.warn("AI_TRIP_CHUNK_API_RETRY", {
        range: rangeLabel,
        apiAttempt,
        retryDelayMs,
        status: getErrorStatus(error),
      });
      await sleep(retryDelayMs);
    }
  }

  throw new Error("AI chunk generation retry limit was reached.");
}
async function generateChunksWithLimitedConcurrency({
  input,
  ranges,
}: {
  input: GenerateTripInput;
  ranges: DayRange[];
}) {
  const chunks: GeneratedTripDay[][] = new Array(ranges.length);
  let nextIndex = 0;
  let firstFailure: unknown = null;

  async function worker() {
    while (firstFailure === null) {
      const index = nextIndex;
      nextIndex += 1;
      const range = ranges[index];

      if (!range) return;

      try {
        chunks[index] = await generateDaysChunk({ input, range });
      } catch (error) {
        firstFailure = error;
        return;
      }
    }
  }

  const workerCount = Math.min(CHUNK_GENERATION_CONCURRENCY, ranges.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  if (firstFailure !== null) {
    throw firstFailure;
  }

  return chunks;
}
export async function generateTripInChunks(
  input: GenerateTripInput,
): Promise<GeneratedTrip> {
  const ranges = createDayRanges(input.daysCount);
  const generatedChunkDays = await generateChunksWithLimitedConcurrency({
    input,
    ranges,
  });
  const generatedDays = generatedChunkDays.flat();

  const combinedTrip = {
    title: createTripTitle(input),
    summary: createTripSummary(input),
    days: validateCompleteTripDays({
      days: generatedDays,
      daysCount: input.daysCount,
    }),
  };

  const parsedTrip = generatedTripSchema.safeParse(combinedTrip);

  if (!parsedTrip.success) {
    console.error(
      "AI chunked trip schema validation failed:",
      parsedTrip.error.flatten(),
    );

    throw new Error("AI chunked trip did not match the required schema.");
  }

  return parsedTrip.data;
}
