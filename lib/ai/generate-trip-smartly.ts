import {
  generateTripWithAi,
  type GenerateTripInput,
} from "@/lib/ai/ai-client";
import { generateTripInChunks } from "@/lib/ai/generate-trip-in-chunks";
import type { GeneratedTrip } from "@/lib/ai/schemas/generated-trip.schema";

const CHUNKED_GENERATION_DAY_THRESHOLD = 7;

export async function generateTripSmartly(
  input: GenerateTripInput
): Promise<GeneratedTrip> {
  if (input.daysCount <= CHUNKED_GENERATION_DAY_THRESHOLD) {
    return generateTripWithAi(input);
  }

  return generateTripInChunks(input);
}
