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

type DayRange = {
  startDay: number;
  endDay: number;
};

function createDayRanges(daysCount: number): DayRange[] {
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
  try {
    const prompt = buildGenerateTripDaysChunkPrompt({
      ...input,
      startDay: range.startDay,
      endDay: range.endDay,
    });

    const result = await generateTextWithGemini({
      prompt,
    });

    const json = extractJsonFromAiText(result.text);
    const parsedChunk = generatedTripChunkSchema.safeParse(json);

    if (!parsedChunk.success) {
      console.error(
        `AI trip chunk schema validation failed for days ${range.startDay}-${range.endDay}:`,
        parsedChunk.error.flatten(),
      );

      throw new Error("AI chunk did not match the required schema.");
    }

    return validateChunkDays({
      days: parsedChunk.data.days,
      range,
    });
  } catch (error) {
    throw createChunkGenerationError({
      error,
      range,
    });
  }
}

export async function generateTripInChunks(
  input: GenerateTripInput,
): Promise<GeneratedTrip> {
  const ranges = createDayRanges(input.daysCount);
  const generatedDays: GeneratedTripDay[] = [];

  for (const range of ranges) {
    const chunkDays = await generateDaysChunk({
      input,
      range,
    });

    generatedDays.push(...chunkDays);
  }

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
