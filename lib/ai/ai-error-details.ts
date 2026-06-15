export type AiGenerationErrorKind =
  | "AI_RATE_LIMIT"
  | "AI_BUSY"
  | "AI_FAILED";

type AiErrorDetails = {
  error: string;
  errorKind: AiGenerationErrorKind;
};

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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message.toLowerCase();

  return String(error).toLowerCase();
}

export function getAiGenerationErrorDetails(error: unknown): AiErrorDetails {
  const status = getErrorStatus(error);
  const message = getErrorMessage(error);

  if (
    status === 429 ||
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("resource_exhausted") ||
    message.includes("token") ||
    message.includes("context length")
  ) {
    return {
      errorKind: "AI_RATE_LIMIT",
      error:
        "AI trip generation limit has been reached for now. Your trip draft was saved, but the itinerary could not be generated yet.",
    };
  }

  if (
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    message.includes("overloaded") ||
    message.includes("unavailable") ||
    message.includes("busy")
  ) {
    return {
      errorKind: "AI_BUSY",
      error:
        "Kartografer AI is in high demand right now. Your trip draft was saved, but the itinerary could not be generated yet.",
    };
  }

  return {
    errorKind: "AI_FAILED",
    error:
      "Kartografer AI could not generate the itinerary right now. Your trip draft was saved, so you can open it and edit manually.",
  };
}

export function getRetryAiErrorMessage(error: unknown) {
  const details = getAiGenerationErrorDetails(error);

  if (details.errorKind === "AI_RATE_LIMIT") {
    return "AI trip generation limit has been reached for now. Please try again in a few minutes.";
  }

  if (details.errorKind === "AI_BUSY") {
    return "Kartografer AI is currently busy. Please try again in a few minutes.";
  }

  return "Kartografer AI could not generate this itinerary right now. Please try again in a few minutes.";
}
