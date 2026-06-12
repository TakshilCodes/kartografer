import { GoogleGenAI } from "@google/genai";

type GenerateTextWithGeminiInput = {
  prompt: string;
};

type GenerateTextWithGeminiResult = {
  text: string;
};

export async function generateTextWithGemini(
  input: GenerateTextWithGeminiInput
): Promise<GenerateTextWithGeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY_DEV;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_DEV is missing.");
  }

  const ai = new GoogleGenAI({
    apiKey,
  });

  const response = await ai.models.generateContent({
    model,
    contents: input.prompt,
  });

  const text = response.text;

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return {
    text,
  };
}