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

export function getGeminiApiKeys() {
  const keys = (process.env.GEMINI_API_KEYS ?? "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);

  if (keys.length === 0) {
    throw new Error(
      "GEMINI_API_KEYS is missing. Add one or more comma-separated Gemini API keys.",
    );
  }

  return keys;
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

  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

function getGeminiModels() {
  return [
    process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    process.env.GEMINI_FALLBACK_MODEL ?? "gemini-2.5-flash-lite",
  ];
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
  input: GenerateTextWithGeminiInput,
): Promise<GenerateTextWithGeminiResult> {
  const apiKeys = getGeminiApiKeys();
  const models = getGeminiModels();
  let lastError: unknown = null;

  for (const [keyIndex, apiKey] of apiKeys.entries()) {
    const ai = new GoogleGenAI({
      apiKey,
    });

    for (const [modelIndex, model] of models.entries()) {
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

          if (!isRetryableGeminiError(error)) {
            throw error;
          }

          const isLastAttempt = attempt === 3;

          if (!isLastAttempt) {
            const delay = attempt * 1500;

            console.warn(
              `Gemini request failed with retryable error. Retrying ${attempt + 1}/3 in ${delay}ms...`,
            );

            await sleep(delay);
          }
        }
      }

      const hasNextModelForSameKey = modelIndex < models.length - 1;
      const hasNextApiKey = keyIndex < apiKeys.length - 1;

      if (hasNextModelForSameKey) {
        console.warn("Switching Gemini model...");
      } else if (hasNextApiKey) {
        console.warn("Switching Gemini API key...");
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Gemini request failed.");
}
