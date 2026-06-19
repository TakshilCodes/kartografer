import {
  generateTripWithAi,
  type GenerateTripInput,
} from "@/lib/ai/ai-client";
import { generateTripInChunks } from "@/lib/ai/generate-trip-in-chunks";
import type { GeneratedTrip } from "@/lib/ai/schemas/generated-trip.schema";
import {
  countNonWhitespaceCharacters,
  MAX_SPECIAL_NOTES_LENGTH,
  MAX_TRIP_DAYS,
  MAX_TRIP_PEOPLE,
} from "@/lib/trips/trip-limits";

const CHUNKED_GENERATION_DAY_THRESHOLD = 7;

export async function generateTripSmartly(
  input: GenerateTripInput
): Promise<GeneratedTrip> {
  if (input.daysCount > MAX_TRIP_DAYS) {
    throw new Error(`Trips cannot be more than ${MAX_TRIP_DAYS} days.`);
  }

  if (input.peopleCount > MAX_TRIP_PEOPLE) {
    throw new Error(`A trip cannot have more than ${MAX_TRIP_PEOPLE} people.`);
  }

  if (
    countNonWhitespaceCharacters(input.specialNotes ?? "") >
    MAX_SPECIAL_NOTES_LENGTH
  ) {
    throw new Error(
      `Special notes cannot be more than ${MAX_SPECIAL_NOTES_LENGTH} characters, excluding spaces.`
    );
  }

  if (input.daysCount <= CHUNKED_GENERATION_DAY_THRESHOLD) {
    return generateTripWithAi(input);
  }

  return generateTripInChunks(input);
}
