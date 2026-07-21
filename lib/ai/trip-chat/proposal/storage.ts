import { z } from "zod";

import { tripAiChangeSchema } from "@/lib/ai/schemas/trip-ai-change.schema";
import type { TripChatContext } from "../context";
import type {
  ProposalValidationResult,
  StoredTripChatPayloadV2,
} from "./types";

export function createStoredTripChatPayload(
  validation: ProposalValidationResult,
): StoredTripChatPayloadV2 {
  return {
    version: 2,
    recommendations: validation.recommendations,
    changes: validation.changes,
    result: validation.result,
    costPreview: validation.costPreview,
  };
}

export function parseStoredTripChatPayload(
  value: unknown,
): StoredTripChatPayloadV2 | null {
  if (
    typeof value === "object" &&
    value !== null &&
    "version" in value &&
    value.version === 2 &&
    "changes" in value &&
    Array.isArray(value.changes) &&
    "result" in value
  ) {
    const changes = z.array(tripAiChangeSchema).safeParse(value.changes);
    if (!changes.success) return null;
    return value as StoredTripChatPayloadV2;
  }

  const legacy = z.array(tripAiChangeSchema).safeParse(value);
  if (!legacy.success) return null;
  return {
    version: 2,
    recommendations: [],
    changes: legacy.data,
    result: {
      responseMode: legacy.data.length > 0 ? "PROPOSAL" : "ANSWER",
      proposalCreated: legacy.data.length > 0,
      validChangeCount: legacy.data.length,
      rejectedChangeCount: 0,
      rejectionReasons: [],
      warnings: [],
    },
    costPreview: null,
  };
}

function money(currency: string, amount: number) {
  return `${currency} ${amount.toLocaleString("en-IN")}`;
}

function signedMoney(currency: string, amount: number) {
  if (amount === 0) return money(currency, 0);
  return `${amount > 0 ? "+" : "-"}${money(currency, Math.abs(amount))}`;
}

function shortNaturalSummary(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "I've put together a practical update for this trip.";
  if (
    /\b(?:I|we)(?:'ve| have)?\s+(?:already\s+)?(?:added|applied|booked|changed|confirmed|created|extended|moved|removed|transformed|updated)\b/i.test(
      normalized,
    )
  ) {
    return "I've put together a practical update for this trip.";
  }
  if (normalized.length <= 240) return normalized;

  const shortened = normalized.slice(0, 240);
  const sentenceEnd = Math.max(
    shortened.lastIndexOf("."),
    shortened.lastIndexOf("!"),
    shortened.lastIndexOf("?"),
  );
  return sentenceEnd >= 100
    ? shortened.slice(0, sentenceEnd + 1)
    : `${shortened.slice(0, 237).trimEnd()}...`;
}

export function buildTruthfulAssistantMessage({
  modelMessage,
  validation,
  context,
}: {
  modelMessage: string;
  validation: ProposalValidationResult;
  context: TripChatContext;
}) {
  const { result, costPreview, recommendations } = validation;
  const currency = context.tripOverview.currency;

  if (result.responseMode === "PROPOSAL") {
    const lines = [shortNaturalSummary(modelMessage)];
    lines.push(
      `${result.validChangeCount} change${result.validChangeCount === 1 ? " is" : "s are"} ready for review. Nothing has been applied.`,
    );
    let costSummary = `Calculated cost impact: ${signedMoney(currency, costPreview.verifiedTotalDelta)}; estimated trip total: ${money(currency, costPreview.resultingEstimatedTotal)}.`;
    if (costPreview.resultingRemainingBudget !== null) {
      costSummary += ` Remaining budget: ${money(currency, costPreview.resultingRemainingBudget)}.`;
    }
    if (costPreview.resultingExceededBy !== null) {
      costSummary += ` Over budget by ${money(currency, costPreview.resultingExceededBy)}.`;
    }
    if ((costPreview.aiEstimatedChangeCount ?? 0) > 0) {
      costSummary += ` AI planning estimates for ${costPreview.aiEstimatedChangeCount} new item${costPreview.aiEstimatedChangeCount === 1 ? "" : "s"}: about ${money(currency, costPreview.aiEstimatedTotal ?? 0)}; excluded from the confirmed total.`;
    }
    if (costPreview.unknownCostChangeCount > 0) {
      costSummary += ` ${costPreview.unknownCostChangeCount} new idea${costPreview.unknownCostChangeCount === 1 ? " has" : "s have"} no cost estimate and ${costPreview.unknownCostChangeCount === 1 ? "is" : "are"} excluded from that total.`;
    }
    lines.push(costSummary);
    if (result.rejectedChangeCount > 0) {
      lines.push(
        `${result.rejectedChangeCount} other idea${result.rejectedChangeCount === 1 ? " was" : "s were"} left out because ${result.rejectedChangeCount === 1 ? "it was not" : "they were not"} safe to prepare.`,
      );
    }
    return lines.join("\n\n");
  }

  if (result.responseMode === "PROPOSAL_FAILED") {
    return recommendations.length > 0
      ? "I couldn't turn the response into a safe review proposal. Nothing has been applied. The grounded ideas I could preserve are under 'Ideas considered'."
      : "I couldn't turn the response into a safe review proposal. Nothing has been applied.";
  }

  return modelMessage;
}
