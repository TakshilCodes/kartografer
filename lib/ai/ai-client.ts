import { buildGenerateTripPrompt } from "@/lib/ai/prompts/generate-trip.prompt";
import { generateTextWithGemini } from "@/lib/ai/gemini.provider";
import {
  generatedTripSchema,
  type GeneratedTrip,
} from "@/lib/ai/schemas/generated-trip.schema";

export type GenerateTripInput = {
  fromPlace: string;
  toPlace: string;
  daysCount: number;
  peopleCount: number;
  budgetAmount: number | null;
  currency: string;
  tripType: string;
  travelPace: string;
  foodPreference: string;
  transportPreference: string;
  specialNotes?: string | null;
};

export function extractJsonFromAiText(text: string) {
  const cleanedText = text
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(cleanedText);
  } catch {
    const firstBraceIndex = cleanedText.indexOf("{");
    const lastBraceIndex = cleanedText.lastIndexOf("}");

    if (firstBraceIndex === -1 || lastBraceIndex === -1) {
      throw new Error("AI response did not contain valid JSON.");
    }

    const jsonText = cleanedText.slice(firstBraceIndex, lastBraceIndex + 1);

    return JSON.parse(jsonText);
  }
}

export async function generateTripWithAi(
  input: GenerateTripInput,
): Promise<GeneratedTrip> {
  const prompt = buildGenerateTripPrompt(input);

  const result = await generateTextWithGemini({
    prompt,
  });

  const json = extractJsonFromAiText(result.text);

  const parsedTrip = generatedTripSchema.safeParse(json);

  if (!parsedTrip.success) {
    console.error(
      "AI trip schema validation failed:",
      parsedTrip.error.flatten(),
    );

    throw new Error("AI generated trip did not match the required schema.");
  }

  return parsedTrip.data;
}
