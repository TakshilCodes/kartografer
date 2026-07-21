import { tripAiChangeSchema, type TripAiChange } from "@/lib/ai/schemas/trip-ai-change.schema";
import type { TripChatContext } from "../context";
import { calculateStayCost, calculateTransportCost, roundMoney } from "@/lib/trips/trip-cost-calculations";
import { MAX_TRIP_DAYS } from "@/lib/trips/trip-limits";
import { MAX_SEMANTIC_EDITS } from "../semantic";
import { inferExtensionCapability } from "./compiler";
import {
  contextItems,
  describeSchemaFailure,
  isSelectChange,
  sanitizeNewItemCost,
  selectCategory,
  selectedTarget,
  validateRecommendations,
  type SelectChange,
} from "./grounding";
import type {
  ProposalChangeCostPreview,
  ProposalCostPreview,
  ProposalResultMetadata,
  ProposalValidationResult,
  ValidatedRecommendation,
} from "./types";

export function isItemAddChange(
  change: TripAiChange,
): change is Extract<
  TripAiChange,
  { type: "ADD_ACTIVITY" | "ADD_MEAL" | "ADD_TRANSPORT" | "ADD_STAY" }
> {
  return (
    change.type === "ADD_ACTIVITY" ||
    change.type === "ADD_MEAL" ||
    change.type === "ADD_TRANSPORT" ||
    change.type === "ADD_STAY"
  );
}

export function changeTargetDayId(change: TripAiChange) {
  return "targetDayId" in change ? (change.targetDayId ?? null) : null;
}

export function changeTargetDayRef(change: TripAiChange) {
  if ("targetDayRef" in change && change.targetDayRef)
    return change.targetDayRef;
  if (isItemAddChange(change) && "dayRef" in change && change.dayRef) {
    return change.dayRef;
  }
  return null;
}

export function validateChanges(raw: unknown[], context: TripChatContext) {
  const valid: TripAiChange[] = [];
  const rejected: string[] = [];
  const warnings: string[] = [];
  const selectedOptionIds = new Set<string>();

  const parsedEntries = raw.map((value, index) => {
    const parsed = tripAiChangeSchema.safeParse(value);
    return { index, value, parsed };
  });
  const addDayCandidates = parsedEntries
    .filter(
      (entry) =>
        entry.index < MAX_SEMANTIC_EDITS &&
        entry.parsed.success &&
        entry.parsed.data.type === "ADD_DAY",
    )
    .map((entry) => (entry.parsed.success ? entry.parsed.data : null))
    .filter((change): change is Extract<TripAiChange, { type: "ADD_DAY" }> =>
      Boolean(change),
    );
  const extensionCapability = inferExtensionCapability(context);
  const hasReusableBlankFinalDay =
    extensionCapability.mode === "REUSE_BLANK_FINAL_DAY";
  const canAddDay =
    addDayCandidates.length === 1 && extensionCapability.mode === "ADD_NEW_DAY";
  const allowedDayRefs = new Set(canAddDay ? [addDayCandidates[0].dayRef] : []);

  for (const { index, value, parsed } of parsedEntries) {
    if (index >= 8) {
      rejected.push(
        `Change ${index + 1}: a proposal can contain at most 8 changes.`,
      );
      continue;
    }
    if (!parsed.success) {
      rejected.push(
        `Change ${index + 1}: ${describeSchemaFailure(value, parsed.error)}`,
      );
      continue;
    }
    let change = parsed.data;

    if (change.type === "ADD_DAY") {
      if (addDayCandidates.length > 1) {
        rejected.push(
          `Change ${index + 1}: only one new day can be added per proposal.`,
        );
        continue;
      }
      if (!canAddDay) {
        rejected.push(
          hasReusableBlankFinalDay
            ? `Change ${index + 1}: use UPDATE_DAY with the existing blank final day instead of adding another day.`
            : `Change ${index + 1}: this trip has reached the ${MAX_TRIP_DAYS}-day limit.`,
        );
        continue;
      }
    }

    const referencedDayId = "dayId" in change ? (change.dayId ?? null) : null;
    if (
      referencedDayId &&
      !context.selectedItinerary.days.some(
        (day) => day.dayId === referencedDayId,
      )
    ) {
      rejected.push(
        `Change ${index + 1}: referenced day is outside this trip.`,
      );
      continue;
    }

    const targetDayId = changeTargetDayId(change);
    if (
      targetDayId &&
      !context.selectedItinerary.days.some((day) => day.dayId === targetDayId)
    ) {
      rejected.push(`Change ${index + 1}: target day is outside this trip.`);
      continue;
    }
    const targetDayRef = changeTargetDayRef(change);
    if (targetDayRef && !allowedDayRefs.has(targetDayRef)) {
      rejected.push(
        `Change ${index + 1}: target day reference does not match the proposed new day.`,
      );
      continue;
    }

    if (
      (change.type.startsWith("UPDATE_") ||
        change.type.startsWith("DELETE_")) &&
      change.type !== "UPDATE_DAY" &&
      !selectedTarget(change, context)
    ) {
      rejected.push(
        `Change ${index + 1}: selected item ID does not belong to this trip.`,
      );
      continue;
    }

    if (change.type === "MOVE_ITINERARY_ITEM") {
      const move = change as Extract<
        TripAiChange,
        { type: "MOVE_ITINERARY_ITEM" }
      >;
      const item = contextItems(context, move.category, true).find(
        (candidate) => candidate.id === move.itemId,
      );
      if (!item || item.dayId !== move.fromDayId) {
        rejected.push(
          `Change ${index + 1}: move source is not a selected item in that category and day.`,
        );
        continue;
      }
      if (move.targetDayId === move.fromDayId) {
        rejected.push(
          `Change ${index + 1}: move destination is the current day.`,
        );
        continue;
      }
    }

    if (isSelectChange(change)) {
      const selection = change as SelectChange;
      const category = selectCategory(selection);
      const option = contextItems(context, category, false).find(
        (item) => item.id === selection.optionId,
      );
      const replacement = selection.replaceSelectedItemId
        ? contextItems(context, category, true).find(
            (item) => item.id === selection.replaceSelectedItemId,
          )
        : null;
      const destinationDayId = selection.targetDayId ?? selection.dayId;

      if (!option || option.dayId !== selection.dayId) {
        rejected.push(
          `Change ${index + 1}: option is missing, already selected, in another category, or its source day is incorrect.`,
        );
        continue;
      }
      if (
        selection.replaceSelectedItemId &&
        (!replacement ||
          Boolean(selection.targetDayRef) ||
          replacement.dayId !== destinationDayId)
      ) {
        rejected.push(
          `Change ${index + 1}: replacement item is not selected in the destination category and day.`,
        );
        continue;
      }
      if (selectedOptionIds.has(selection.optionId)) {
        rejected.push(
          `Change ${index + 1}: the same option was selected twice.`,
        );
        continue;
      }
      selectedOptionIds.add(selection.optionId);
    }

    if (isItemAddChange(change)) {
      const sanitized = sanitizeNewItemCost(change);
      if (JSON.stringify(sanitized) !== JSON.stringify(change)) {
        warnings.push(
          `Change ${index + 1}: unverified exact cost was removed.`,
        );
      }
      change = sanitized;
    }

    valid.push(change);
  }

  return { valid, rejected, warnings };
}

export function costLine(
  change: TripAiChange,
  changeIndex: number,
  context: TripChatContext,
): ProposalChangeCostPreview {
  if (isItemAddChange(change)) {
    return {
      changeIndex,
      type: change.type,
      label: change.label,
      beforeCost: 0,
      afterCost: null,
      delta: null,
      costVerified: false,
      aiEstimatedCost: change.aiEstimatedCost ?? null,
    };
  }

  if (change.type === "ADD_DAY" || change.type === "MOVE_ITINERARY_ITEM") {
    return {
      changeIndex,
      type: change.type,
      label: change.label,
      beforeCost: 0,
      afterCost: 0,
      delta: 0,
      costVerified: true,
    };
  }

  if (isSelectChange(change)) {
    const selection = change as SelectChange;
    const category = selectCategory(selection);
    const option = contextItems(context, category, false).find(
      (item) => item.id === selection.optionId,
    );
    const replacement = selection.replaceSelectedItemId
      ? contextItems(context, category, true).find(
          (item) => item.id === selection.replaceSelectedItemId,
        )
      : null;
    const before = replacement?.calculatedTripCost ?? 0;
    const after = option?.calculatedTripCost ?? 0;
    return {
      changeIndex,
      type: change.type,
      label: change.label,
      beforeCost: before,
      afterCost: after,
      delta: roundMoney(after - before),
      costVerified: true,
    };
  }

  const target = selectedTarget(change, context);
  const before = target?.calculatedTripCost ?? 0;

  if (
    (change.type === "UPDATE_ACTIVITY" || change.type === "UPDATE_MEAL") &&
    change.data.estimatedCost !== undefined
  ) {
    const after = change.data.estimatedCost ?? 0;
    return {
      changeIndex,
      type: change.type,
      label: change.label,
      beforeCost: before,
      afterCost: after,
      delta: roundMoney(after - before),
      costVerified: false,
      isAiPriceEstimate: true,
    };
  }

  if (
    change.type === "UPDATE_TRANSPORT" &&
    (change.data.costType !== undefined ||
      change.data.pricePerPerson !== undefined ||
      change.data.totalCost !== undefined)
  ) {
    const isAiPriceEstimate =
      change.data.pricePerPerson !== undefined ||
      change.data.totalCost !== undefined;
    const after = calculateTransportCost(
      {
        costType: change.data.costType ?? target?.costType ?? "TOTAL",
        pricePerPerson:
          change.data.pricePerPerson === undefined
            ? target?.pricePerPerson
            : change.data.pricePerPerson,
        totalCost:
          change.data.totalCost === undefined
            ? target?.totalCost
            : change.data.totalCost,
      },
      Math.max(context.tripOverview.travellers || 1, 1),
    );
    return {
      changeIndex,
      type: change.type,
      label: change.label,
      beforeCost: before,
      afterCost: after,
      delta: roundMoney(after - before),
      costVerified: !isAiPriceEstimate,
      isAiPriceEstimate,
    };
  }

  if (
    change.type === "UPDATE_STAY" &&
    (change.data.nights !== undefined ||
      change.data.pricePerNight !== undefined ||
      change.data.totalCost !== undefined)
  ) {
    const isAiPriceEstimate =
      change.data.pricePerNight !== undefined ||
      change.data.totalCost !== undefined;
    const after = calculateStayCost({
      pricePerNight:
        change.data.pricePerNight === undefined
          ? target?.pricePerNight
          : change.data.pricePerNight,
      nights:
        change.data.nights === undefined
          ? (target?.nights ?? null)
          : change.data.nights,
      totalCost:
        change.data.totalCost === undefined
          ? target?.totalCost
          : change.data.totalCost,
    });
    return {
      changeIndex,
      type: change.type,
      label: change.label,
      beforeCost: before,
      afterCost: after,
      delta: roundMoney(after - before),
      costVerified: !isAiPriceEstimate,
      isAiPriceEstimate,
    };
  }

  const deleted = change.type.startsWith("DELETE_");
  return {
    changeIndex,
    type: change.type,
    label: change.label,
    beforeCost: before,
    afterCost: deleted ? 0 : before,
    delta: deleted ? roundMoney(-before) : 0,
    costVerified: true,
  };
}

export function buildProposalCostPreview(
  changes: TripAiChange[],
  context: TripChatContext,
): ProposalCostPreview {
  const lines = changes.map((change, index) =>
    costLine(change, index, context),
  );
  const verifiedTotalDelta = roundMoney(
    lines.reduce((total, line) => total + (line.delta ?? 0), 0),
  );
  const resultingEstimatedTotal = roundMoney(
    context.budgetFacts.currentEstimatedSelectedTotal + verifiedTotalDelta,
  );
  const budget = context.budgetFacts.configuredBudget;

  const aiEstimatedLines = lines.filter(
    (line) =>
      !line.costVerified &&
      line.aiEstimatedCost !== null &&
      line.aiEstimatedCost !== undefined,
  );

  return {
    currency: context.tripOverview.currency,
    currentTripTotal: context.budgetFacts.currentEstimatedSelectedTotal,
    changes: lines,
    verifiedTotalDelta,
    resultingEstimatedTotal,
    resultingRemainingBudget:
      budget !== null && resultingEstimatedTotal <= budget
        ? roundMoney(budget - resultingEstimatedTotal)
        : null,
    resultingExceededBy:
      budget !== null && resultingEstimatedTotal > budget
        ? roundMoney(resultingEstimatedTotal - budget)
        : null,
    unknownCostChangeCount: lines.filter(
      (line) =>
        !line.costVerified &&
        (line.aiEstimatedCost === null || line.aiEstimatedCost === undefined),
    ).length,
    aiEstimatedChangeCount: aiEstimatedLines.length,
    aiEstimatedTotal: roundMoney(
      aiEstimatedLines.reduce(
        (total, line) => total + (line.aiEstimatedCost ?? 0),
        0,
      ),
    ),
  };
}

export function validateAiTripResponse({
  rawRecommendations,
  rawChanges,
  context,
  proposalExpected,
  previousRecommendations = [],
  compilerRejectionReasons = [],
}: {
  rawRecommendations: unknown[];
  rawChanges: unknown[];
  context: TripChatContext;
  proposalExpected: boolean;
  previousRecommendations?: ValidatedRecommendation[];
  compilerRejectionReasons?: string[];
}): ProposalValidationResult {
  const recommendations = validateRecommendations(
    rawRecommendations,
    context,
    previousRecommendations,
  );
  const changes = validateChanges(rawChanges, context);
  const proposalCreated = changes.valid.length > 0;
  const rejectionReasons = [
    ...recommendations.rejected,
    ...compilerRejectionReasons,
    ...changes.rejected,
  ];
  const rejectedChangeCount =
    compilerRejectionReasons.length + changes.rejected.length;
  const result: ProposalResultMetadata = {
    responseMode: proposalCreated
      ? "PROPOSAL"
      : proposalExpected || rejectedChangeCount > 0
        ? "PROPOSAL_FAILED"
        : "ANSWER",
    proposalCreated,
    validChangeCount: changes.valid.length,
    rejectedChangeCount,
    rejectionReasons,
    warnings: changes.warnings,
  };

  return {
    recommendations: recommendations.valid,
    changes: changes.valid,
    result,
    costPreview: buildProposalCostPreview(changes.valid, context),
  };
}

