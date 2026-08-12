import {
  tripAiChangeSchema,
  type TripAiChange,
  type TripAiRecommendation,
} from "@/lib/ai/schemas/trip-ai-change.schema";
import type { TripChatContext } from "../context";
import {
  EXTENSION_DAY_TARGET,
  MAX_SEMANTIC_EDITS,
  type SemanticTripProposalResponse,
} from "../semantic";
import { MAX_TRIP_DAYS } from "@/lib/trips/trip-limits";
import {
  contextItems,
  describeSchemaFailure,
  itemTitle,
  normalizedItemTitle,
  type Category,
  type ContextItem,
  type SelectChange,
} from "./grounding";

const MAX_PROPOSAL_CHANGES = MAX_SEMANTIC_EDITS;
const EXTENSION_DAY = EXTENSION_DAY_TARGET;
const EXTENSION_DAY_REF = "extension_day";

export type CompiledSemanticTripProposal = {
  modelMessage: string;
  rawChanges: TripAiChange[];
  rawRecommendations: TripAiRecommendation[];
  rejectedEdits: string[];
};

type CategorizedItem = { category: Category; item: ContextItem };
type ExtensionCapability =
  | { mode: "REUSE_BLANK_FINAL_DAY"; dayId: string; dayNumber: number }
  | { mode: "ADD_NEW_DAY"; nextDayNumber: number }
  | { mode: "BLOCKED_MAX_DAYS"; maxDays: number };
type ResolvedDestination =
  | { dayId: string; dayNumber: number }
  | { dayRef: string; dayNumber: number };

function categorizedItems(context: TripChatContext, selected: boolean) {
  return (["ACTIVITY", "MEAL", "TRANSPORT", "STAY"] as const).flatMap(
    (category) =>
      contextItems(context, category, selected).map((item) => ({
        category,
        item,
      })),
  );
}

function findCategorizedItem(
  context: TripChatContext,
  id: string,
  selected: boolean,
): CategorizedItem | null {
  const matches = categorizedItems(context, selected).filter(
    ({ item }) => item.id === id,
  );
  return matches.length === 1 ? matches[0] : null;
}

export function inferExtensionCapability(
  context: TripChatContext,
): ExtensionCapability {
  const supplied = (
    context as TripChatContext & {
      editCapabilities?: { dayExtension?: ExtensionCapability };
    }
  ).editCapabilities?.dayExtension;
  if (supplied) return supplied;

  const days = [...context.selectedItinerary.days].sort(
    (left, right) => left.dayNumber - right.dayNumber,
  );
  const finalDay = days.at(-1);
  const finalDayIsBlank = Boolean(
    finalDay &&
    !finalDay.description?.trim() &&
    !finalDay.notes?.trim() &&
    (finalDay.storedEstimatedCost ?? 0) <= 0 &&
    finalDay.calculatedSelectedCost <= 0 &&
    finalDay.transports.length === 0 &&
    finalDay.stays.length === 0 &&
    finalDay.meals.length === 0 &&
    finalDay.activities.length === 0,
  );
  if (finalDay && finalDayIsBlank) {
    return {
      mode: "REUSE_BLANK_FINAL_DAY",
      dayId: finalDay.dayId,
      dayNumber: finalDay.dayNumber,
    };
  }

  const currentDayCount = Math.max(
    context.tripOverview.tripDays,
    days.length,
    ...days.map((day) => day.dayNumber),
  );
  if (currentDayCount >= MAX_TRIP_DAYS) {
    return { mode: "BLOCKED_MAX_DAYS", maxDays: MAX_TRIP_DAYS };
  }
  return {
    mode: "ADD_NEW_DAY",
    nextDayNumber: Math.max(0, ...days.map((day) => day.dayNumber)) + 1,
  };
}

function pickContent(
  content: Record<string, unknown>,
  allowedFields: readonly string[],
) {
  return Object.fromEntries(
    allowedFields
      .filter((field) => Object.prototype.hasOwnProperty.call(content, field))
      .map((field) => [field, content[field]]),
  );
}

const activityContentFields = [
  "title",
  "description",
  "locationName",
  "address",
  "startTime",
  "endTime",
  "durationMinutes",
  "activityCategory",
  "notes",
  "position",
] as const;
const mealContentFields = [
  "mealType",
  "title",
  "locationName",
  "notes",
] as const;
const transportContentFields = [
  "title",
  "mode",
  "fromText",
  "toText",
  "description",
  "costType",
  "notes",
] as const;
const stayContentFields = [
  "title",
  "city",
  "area",
  "stayType",
  "budgetLevel",
  "nights",
  "bestFor",
  "notes",
] as const;
const dayContentFields = ["title", "description", "notes"] as const;

function itemContentFields(category: Category) {
  if (category === "ACTIVITY") return activityContentFields;
  if (category === "MEAL") return mealContentFields;
  if (category === "TRANSPORT") return transportContentFields;
  return stayContentFields;
}

function unsupportedContentFields(
  category: Category,
  content: Record<string, unknown>,
) {
  const allowed = new Set<string>(itemContentFields(category));
  return Object.keys(content).filter((field) => !allowed.has(field));
}

function compilePriceUpdate(
  category: Category,
  approximateCost: number | undefined,
) {
  if (approximateCost === undefined) return {};
  if (category === "ACTIVITY" || category === "MEAL") {
    return { estimatedCost: approximateCost };
  }
  if (category === "TRANSPORT") {
    return {
      costType: "TOTAL" as const,
      pricePerPerson: null,
      totalCost: approximateCost,
    };
  }
  return { pricePerNight: null, totalCost: approximateCost };
}

function compileItemContent(
  category: Category,
  content: Record<string, unknown>,
) {
  const picked = pickContent(content, itemContentFields(category));
  if (category === "ACTIVITY") {
    const { activityCategory, ...data } = picked;
    return activityCategory === undefined
      ? data
      : { ...data, category: activityCategory };
  }
  if (category === "STAY") {
    const { title, ...data } = picked;
    return title === undefined ? data : { ...data, name: title };
  }
  return picked;
}

function targetFields(destination: ResolvedDestination, prefix: "" | "target") {
  if ("dayId" in destination) {
    return prefix === ""
      ? { dayId: destination.dayId }
      : { targetDayId: destination.dayId };
  }
  return prefix === ""
    ? { dayRef: destination.dayRef }
    : { targetDayRef: destination.dayRef };
}

function destinationLabel(destination: ResolvedDestination) {
  return `Day ${destination.dayNumber}`;
}

function changeLabel(value: string) {
  return value.length <= 160 ? value : `${value.slice(0, 157)}...`;
}

function addActionType(category: Category) {
  return `ADD_${category}` as const;
}

function updateActionType(category: Category) {
  return `UPDATE_${category}` as const;
}

function deleteActionType(category: Category) {
  return `DELETE_${category}` as const;
}

function selectActionType(category: Category) {
  return `SELECT_${category}_OPTION` as SelectChange["type"];
}

function itemIdField(category: Category) {
  if (category === "ACTIVITY") return "activityId";
  if (category === "MEAL") return "mealId";
  if (category === "TRANSPORT") return "transportId";
  return "stayId";
}

export function compileSemanticTripProposal({
  proposal,
  context,
}: {
  proposal: SemanticTripProposalResponse;
  context: TripChatContext;
}): CompiledSemanticTripProposal {
  const rawChanges: TripAiChange[] = [];
  const rawRecommendations: TripAiRecommendation[] = [];
  const rejectedEdits: string[] = [];
  let extensionDestination: ResolvedDestination | null = null;

  const addCompiledChange = (candidate: unknown, source: string) => {
    if (rawChanges.length >= MAX_PROPOSAL_CHANGES) {
      rejectedEdits.push(
        `${source}: a proposal can contain at most ${MAX_PROPOSAL_CHANGES} changes.`,
      );
      return false;
    }
    const parsed = tripAiChangeSchema.safeParse(candidate);
    if (!parsed.success) {
      rejectedEdits.push(
        `${source}: ${describeSchemaFailure(candidate, parsed.error)}`,
      );
      return false;
    }
    rawChanges.push(parsed.data);
    return true;
  };

  if (proposal.plan.extendTrip) {
    const extension = proposal.plan.extendTrip;
    const capability = inferExtensionCapability(context);
    if (capability.mode === "BLOCKED_MAX_DAYS") {
      rejectedEdits.push(
        `Day extension: this trip has reached the ${capability.maxDays}-day limit.`,
      );
    } else if (capability.mode === "REUSE_BLANK_FINAL_DAY") {
      const destination = {
        dayId: capability.dayId,
        dayNumber: capability.dayNumber,
      };
      const accepted = addCompiledChange(
        {
          type: "UPDATE_DAY",
          dayId: capability.dayId,
          label: changeLabel(
            `Plan Day ${capability.dayNumber}: ${extension.title}`,
          ),
          reason: extension.reason,
          data: pickContent(
            extension as unknown as Record<string, unknown>,
            dayContentFields,
          ),
        },
        "Day extension",
      );
      if (accepted) extensionDestination = destination;
    } else {
      const destination = {
        dayRef: EXTENSION_DAY_REF,
        dayNumber: capability.nextDayNumber,
      };
      const accepted = addCompiledChange(
        {
          type: "ADD_DAY",
          dayRef: EXTENSION_DAY_REF,
          label: changeLabel(
            `Add Day ${capability.nextDayNumber}: ${extension.title}`,
          ),
          reason: extension.reason,
          data: pickContent(
            extension as unknown as Record<string, unknown>,
            dayContentFields,
          ),
        },
        "Day extension",
      );
      if (accepted) extensionDestination = destination;
    }
  }

  const resolveDestination = (
    targetDay: string,
    source: string,
  ): ResolvedDestination | null => {
    if (targetDay === EXTENSION_DAY) {
      if (!proposal.plan.extendTrip || !extensionDestination) {
        rejectedEdits.push(
          `${source}: EXTENSION_DAY requires a valid trip extension in the same proposal.`,
        );
        return null;
      }
      return extensionDestination;
    }
    const day = context.selectedItinerary.days.find(
      (candidate) => candidate.dayId === targetDay,
    );
    if (!day) {
      rejectedEdits.push(`${source}: target day is outside this trip.`);
      return null;
    }
    return { dayId: day.dayId, dayNumber: day.dayNumber };
  };

  proposal.plan.edits.forEach((edit, index) => {
    const source = `Edit ${index + 1} (${edit.type})`;
    if (rawChanges.length >= MAX_PROPOSAL_CHANGES) {
      rejectedEdits.push(
        `${source}: a proposal can contain at most ${MAX_PROPOSAL_CHANGES} changes.`,
      );
      return;
    }

    if (edit.type === "MOVE_SELECTED_ITEM") {
      const selected = findCategorizedItem(context, edit.itemId, true);
      if (!selected) {
        rejectedEdits.push(
          `${source}: selected item ID is not part of this trip.`,
        );
        return;
      }
      const destination = resolveDestination(edit.targetDay, source);
      if (!selected.item.dayId) {
        rejectedEdits.push(
          `${source}: an unassigned selected item cannot be moved between days.`,
        );
        return;
      }
      if (!destination) return;
      addCompiledChange(
        {
          type: "MOVE_ITINERARY_ITEM",
          category: selected.category,
          itemId: selected.item.id,
          fromDayId: selected.item.dayId,
          ...targetFields(destination, "target"),
          label: changeLabel(
            `Move ${itemTitle(selected.item)} to ${destinationLabel(destination)}`,
          ),
          reason: edit.reason,
        },
        source,
      );
      return;
    }

    if (edit.type === "USE_SAVED_OPTION") {
      const option = findCategorizedItem(context, edit.optionId, false);
      if (!option || !option.item.dayId) {
        rejectedEdits.push(
          `${source}: saved option ID is not available in this trip and category.`,
        );
        return;
      }
      const destination = resolveDestination(edit.targetDay, source);
      if (!destination) return;
      let replacement: CategorizedItem | null = null;
      if (edit.replaceItemId) {
        replacement = findCategorizedItem(context, edit.replaceItemId, true);
        if (!replacement || replacement.category !== option.category) {
          rejectedEdits.push(
            `${source}: replacement item is not a selected item in the option category.`,
          );
          return;
        }
        if (
          !("dayId" in destination) ||
          replacement.item.dayId !== destination.dayId
        ) {
          rejectedEdits.push(
            `${source}: replacement item must already be selected on the destination day.`,
          );
          return;
        }
      }
      if (
        addCompiledChange(
          {
            type: selectActionType(option.category),
            optionId: option.item.id,
            dayId: option.item.dayId,
            ...targetFields(destination, "target"),
            replaceSelectedItemId: replacement?.item.id ?? null,
            label: changeLabel(
              `Use ${itemTitle(option.item)} on ${destinationLabel(destination)}`,
            ),
            reason: edit.reason,
          },
          source,
        )
      ) {
        rawRecommendations.push({
          provenance: "EXISTING_OPTION",
          category: option.category,
          itemId: option.item.id,
          dayId: option.item.dayId,
          title: itemTitle(option.item),
          reason: edit.reason,
        });
      }
      return;
    }

    if (edit.type === "ADD_ITEM") {
      const unsupportedFields = unsupportedContentFields(
        edit.category,
        edit.content,
      );
      if (unsupportedFields.length > 0) {
        rejectedEdits.push(
          `${source}: ${unsupportedFields.join(", ")} ${
            unsupportedFields.length === 1 ? "is" : "are"
          } not valid for ${edit.category}.`,
        );
        return;
      }
      const destination = resolveDestination(edit.targetDay, source);
      if (!destination) return;
      const content = compileItemContent(edit.category, edit.content);
      const title =
        typeof content.title === "string"
          ? content.title
          : typeof content.name === "string"
            ? content.name
            : "New trip item";
      const normalizedTitle = normalizedItemTitle(title);
      const matchingSelected = contextItems(context, edit.category, true).find(
        (item) =>
          normalizedItemTitle(itemTitle(item)) === normalizedTitle &&
          (edit.category === "STAY" ||
            ("dayId" in destination && item.dayId === destination.dayId)),
      );
      if (matchingSelected) {
        rejectedEdits.push(
          `${source}: "${itemTitle(
            matchingSelected,
          )}" is already selected; update or move item ${matchingSelected.id} instead of adding a duplicate.`,
        );
        return;
      }
      const matchingOption = contextItems(context, edit.category, false).find(
        (item) => normalizedItemTitle(itemTitle(item)) === normalizedTitle,
      );
      if (matchingOption) {
        rejectedEdits.push(
          `${source}: "${itemTitle(
            matchingOption,
          )}" is a saved option; use USE_SAVED_OPTION with optionId ${matchingOption.id}.`,
        );
        return;
      }

      if (
        addCompiledChange(
          {
            type: addActionType(edit.category),
            ...targetFields(destination, ""),
            label: changeLabel(
              `Add ${title} to ${destinationLabel(destination)}`,
            ),
            reason: edit.reason,
            aiEstimatedCost: edit.approximateCost,
            data: content,
          },
          source,
        )
      ) {
        rawRecommendations.push({
          provenance: "NEW_AI_SUGGESTION",
          category: edit.category,
          dayId: "dayId" in destination ? destination.dayId : null,
          title,
          reason: edit.reason,
        });
      }
      return;
    }

    if (edit.type === "UPDATE_SELECTED_ITEM") {
      const selected = findCategorizedItem(context, edit.itemId, true);
      if (!selected) {
        rejectedEdits.push(
          `${source}: selected item ID is not part of this trip.`,
        );
        return;
      }
      const unsupportedFields = unsupportedContentFields(
        selected.category,
        edit.content,
      );
      if (unsupportedFields.length > 0) {
        rejectedEdits.push(
          `${source}: ${unsupportedFields.join(", ")} ${
            unsupportedFields.length === 1 ? "is" : "are"
          } not valid for ${selected.category}.`,
        );
        return;
      }
      addCompiledChange(
        {
          type: updateActionType(selected.category),
          [itemIdField(selected.category)]: selected.item.id,
          label: changeLabel(`Update ${itemTitle(selected.item)}`),
          reason: edit.reason,
          data: {
            ...compileItemContent(selected.category, edit.content),
            ...compilePriceUpdate(selected.category, edit.approximateCost),
          },
        },
        source,
      );
      return;
    }

    if (edit.type === "REMOVE_SELECTED_ITEM") {
      const selected = findCategorizedItem(context, edit.itemId, true);
      if (!selected) {
        rejectedEdits.push(
          `${source}: selected item ID is not part of this trip.`,
        );
        return;
      }
      addCompiledChange(
        {
          type: deleteActionType(selected.category),
          [itemIdField(selected.category)]: selected.item.id,
          label: changeLabel(`Remove ${itemTitle(selected.item)}`),
          reason: edit.reason,
        },
        source,
      );
      return;
    }

    const day = context.selectedItinerary.days.find(
      (candidate) => candidate.dayId === edit.dayId,
    );
    if (!day) {
      rejectedEdits.push(`${source}: referenced day is outside this trip.`);
      return;
    }
    addCompiledChange(
      {
        type: "UPDATE_DAY",
        dayId: day.dayId,
        label: changeLabel(`Update Day ${day.dayNumber}`),
        reason: edit.reason,
        data: pickContent(edit.content, dayContentFields),
      },
      source,
    );
  });

  return {
    modelMessage:
      proposal.assistantMessage.trim() ||
      "I've put together a practical update for this trip.",
    rawChanges,
    rawRecommendations,
    rejectedEdits,
  };
}
