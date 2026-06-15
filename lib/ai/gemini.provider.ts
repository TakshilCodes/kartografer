import { GoogleGenAI } from "@google/genai";

type GenerateTextWithGeminiInput = {
  prompt: string;
};

type GenerateTextWithGeminiResult = {
  text: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function isRetryableGeminiError(error: unknown) {
  const status = getErrorStatus(error);

  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

async function generateWithModel({
  ai,
  model,
  prompt,
}: {
  ai: GoogleGenAI;
  model: string;
  prompt: string;
}) {
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  const text = response.text;

  if (!text) {
    throw new Error(`Gemini model ${model} returned an empty response.`);
  }

  return text;
}

export async function generateTextWithGemini(
  input: GenerateTextWithGeminiInput
): Promise<GenerateTextWithGeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY_DEV;

  const models = [
    process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    process.env.GEMINI_FALLBACK_MODEL ?? "gemini-2.5-flash-lite",
  ];

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_DEV is missing.");
  }

  const ai = new GoogleGenAI({
    apiKey,
  });

  let lastError: unknown = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const text = await generateWithModel({
          ai,
          model,
          prompt: input.prompt,
        });

        return {
          text,
        };
      } catch (error) {
        lastError = error;

        const isLastAttempt = attempt === 3;

        if (!isRetryableGeminiError(error) || isLastAttempt) {
          break;
        }

        const delay = attempt * 1500;

        console.warn(
          `Gemini model ${model} failed. Retrying ${attempt + 1}/3 in ${delay}ms...`
        );

        await sleep(delay);
      }
    }

    console.warn(`Switching from Gemini model ${model} to fallback model...`);
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Gemini request failed.");
}