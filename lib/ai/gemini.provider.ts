import { GoogleGenAI, type GenerateContentConfig } from "@google/genai";

type GenerateTextWithGeminiInput = {
  prompt: string;
  config?: GenerateContentConfig;
  /** Keeps interactive callers from waiting through every key/model retry. */
  maxAttemptsPerModel?: number;
  maxRequests?: number;
  /** Internal callers can prefer a model order for a specific workload. */
  models?: string[];
};

type GenerateTextWithGeminiResult = {
  text: string;
  modelUsed: string;
  finishReason: string | null;
  usage: {
    promptTokenCount: number | null;
    candidatesTokenCount: number | null;
    thoughtsTokenCount: number | null;
    totalTokenCount: number | null;
  } | null;
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

function getGeminiModels(preferredModels?: string[]) {
  const configuredModels = [
    process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    process.env.GEMINI_FALLBACK_MODEL ?? "gemini-2.5-flash-lite",
  ];
  const models = preferredModels?.length
    ? preferredModels
    : configuredModels;

  return [...new Set(models.filter(Boolean))];
}

async function generateWithModel({
  ai,
  model,
  prompt,
  config,
}: {
  ai: GoogleGenAI;
  model: string;
  prompt: string;
  config?: GenerateContentConfig;
}): Promise<GenerateTextWithGeminiResult> {
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config,
  });

  const text = response.text;

  if (!text) {
    throw new Error(`Gemini model ${model} returned an empty response.`);
  }

  const usage = response.usageMetadata;
  return {
    text,
    modelUsed: response.modelVersion ?? model,
    finishReason: response.candidates?.[0]?.finishReason ?? null,
    usage: usage
      ? {
          promptTokenCount: usage.promptTokenCount ?? null,
          candidatesTokenCount: usage.candidatesTokenCount ?? null,
          thoughtsTokenCount: usage.thoughtsTokenCount ?? null,
          totalTokenCount: usage.totalTokenCount ?? null,
        }
      : null,
  };
}

export async function generateTextWithGemini(
  input: GenerateTextWithGeminiInput,
): Promise<GenerateTextWithGeminiResult> {
  const apiKeys = getGeminiApiKeys();
  const models = getGeminiModels(input.models);
  const maxAttemptsPerModel = input.maxAttemptsPerModel ?? 3;
  const maxRequests = input.maxRequests ?? Number.POSITIVE_INFINITY;
  let requestCount = 0;
  let lastError: unknown = null;

  for (const [keyIndex, apiKey] of apiKeys.entries()) {
    const ai = new GoogleGenAI({
      apiKey,
    });

    for (const [modelIndex, model] of models.entries()) {
      for (let attempt = 1; attempt <= maxAttemptsPerModel; attempt++) {
        if (requestCount >= maxRequests) {
          throw lastError instanceof Error
            ? lastError
            : new Error(
                "Gemini request limit reached before a response was returned.",
              );
        }
        try {
          requestCount += 1;
          return await generateWithModel({
            ai,
            model,
            prompt: input.prompt,
            config: input.config,
          });
        } catch (error) {
          lastError = error;

          if (!isRetryableGeminiError(error)) {
            throw error;
          }

          const isLastAttempt = attempt === maxAttemptsPerModel;

          if (!isLastAttempt) {
            const delay = attempt * 1500;

            console.warn(
              `Gemini request failed with retryable error. Retrying ${attempt + 1}/${maxAttemptsPerModel} in ${delay}ms...`,
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
