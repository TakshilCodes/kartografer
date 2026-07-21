import { z } from "zod";

import {
  tripAiRecommendationSchema,
  type TripAiChange,
} from "@/lib/ai/schemas/trip-ai-change.schema";
import type { TripChatContext } from "../context";
import type { ValidatedRecommendation } from "./types";

export type Category = "ACTIVITY" | "MEAL" | "TRANSPORT" | "STAY";
export type ContextItem = {
  id: string;
  dayId: string | null;
  dayNumber: number | null;
  calculatedTripCost: number;
  isSelected: boolean;
  title?: string;
  name?: string;
  costType?: string;
  pricePerPerson?: number | null;
  totalCost?: number | null;
  pricePerNight?: number | null;
  nights?: number | null;
};
export type SelectChange = TripAiChange & {
  type:
    | "SELECT_ACTIVITY_OPTION"
    | "SELECT_MEAL_OPTION"
    | "SELECT_TRANSPORT_OPTION"
    | "SELECT_STAY_OPTION";
  optionId: string;
  dayId: string;
  targetDayId?: string;
  targetDayRef?: string;
  replaceSelectedItemId?: string | null;
};

export function isSelectChange(change: TripAiChange): change is SelectChange {
  return (
    change.type === "SELECT_ACTIVITY_OPTION" ||
    change.type === "SELECT_MEAL_OPTION" ||
    change.type === "SELECT_TRANSPORT_OPTION" ||
    change.type === "SELECT_STAY_OPTION"
  );
}

export function selectCategory(change: SelectChange): Category {
  if (change.type === "SELECT_ACTIVITY_OPTION") return "ACTIVITY";
  if (change.type === "SELECT_MEAL_OPTION") return "MEAL";
  if (change.type === "SELECT_TRANSPORT_OPTION") return "TRANSPORT";
  return "STAY";
}

export function contextItems(
  context: TripChatContext,
  category: Category,
  selected: boolean,
): ContextItem[] {
  if (!selected) {
    if (category === "ACTIVITY")
      return context.unselectedOptions.activities.items;
    if (category === "MEAL") return context.unselectedOptions.meals.items;
    if (category === "TRANSPORT")
      return context.unselectedOptions.transports.items;
    return context.unselectedOptions.stays.items;
  }

  const days = context.selectedItinerary.days;
  if (category === "ACTIVITY") return days.flatMap((day) => day.activities);
  if (category === "MEAL") return days.flatMap((day) => day.meals);
  if (category === "TRANSPORT") {
    return [
      ...days.flatMap((day) => day.transports),
      ...context.selectedItinerary.unassigned.transports,
    ];
  }
  return [
    ...days.flatMap((day) => day.stays),
    ...context.selectedItinerary.unassigned.stays,
  ];
}

export function itemTitle(item: ContextItem) {
  return item.title ?? item.name ?? "Saved trip item";
}

export function normalizedItemTitle(value: string) {
  return value
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function safeIssue(error: z.ZodError) {
  return (
    error.issues[0]?.message ?? "The output did not match the required schema."
  );
}

export function describeSchemaFailure(value: unknown, error: z.ZodError) {   const type =     typeof value === "object" &&     value !== null &&     "type" in value &&     typeof value.type === "string"       ? value.type       : "unknown action";   const flattened = error.flatten();   const fieldErrors = flattened.fieldErrors as Record<     string,     string[] | undefined   >;   const fields = Object.entries(fieldErrors)     .filter(([, messages]) => (messages?.length ?? 0) > 0)     .map(([field, messages]) => `${field}: ${(messages ?? []).join(", ")}`);    return fields.length > 0     ? `${type} - ${fields.join("; ")}`     : `${type} does not match a supported action shape.`; } export function validateRecommendations(
  raw: unknown[],
  context: TripChatContext,
  previous: ValidatedRecommendation[] = [],
) {
  const valid: ValidatedRecommendation[] = [];
  const rejected: string[] = [];
  const authoritativePrevious: ValidatedRecommendation[] = [];
  for (const recommendation of previous) {
    if (
      recommendation.provenance === "NEW_AI_SUGGESTION" ||
      recommendation.provenance === "LIVE_INFORMATION_REQUIRED"
    ) {
      const dayStillExists =
        !recommendation.dayId ||
        context.selectedItinerary.days.some(
          (day) => day.dayId === recommendation.dayId,
        );
      if (dayStillExists) authoritativePrevious.push(recommendation);
      continue;
    }
    if (recommendation.category === "GENERAL") continue;
    const item = contextItems(
      context,
      recommendation.category,
      recommendation.provenance === "EXISTING_SELECTED_ITEM",
    ).find(
      (candidate) =>
        candidate.id === recommendation.itemId &&
        candidate.dayId === recommendation.dayId,
    );
    if (!item) continue;
    authoritativePrevious.push({
      ...recommendation,
      title: itemTitle(item),
      resolvedTitle: itemTitle(item),
      storedCost: item.calculatedTripCost,
      costVerified: true,
    });
  }

  raw.forEach((rawValue, index) => {
    const value = rawValue;
    if (
      typeof rawValue === "object" &&
      rawValue !== null &&
      "title" in rawValue
    ) {
      const title =
        typeof rawValue.title === "string"
          ? rawValue.title.trim().toLowerCase()
          : "";
      const category = "category" in rawValue ? rawValue.category : null;
      const authoritative = authoritativePrevious.find(
        (item) =>
          item.resolvedTitle.trim().toLowerCase() === title &&
          (category === null || item.category === category),
      );
      if (authoritative) {
        valid.push({
          ...authoritative,
          reason:
            "reason" in rawValue && typeof rawValue.reason === "string"
              ? rawValue.reason
              : authoritative.reason,
        });
        return;
      }
    }

    const parsed = tripAiRecommendationSchema.safeParse(value);
    if (!parsed.success) {
      rejected.push(`Recommendation ${index + 1}: ${safeIssue(parsed.error)}`);
      return;
    }
    const recommendation = parsed.data;

    if (
      recommendation.provenance === "NEW_AI_SUGGESTION" ||
      recommendation.provenance === "LIVE_INFORMATION_REQUIRED"
    ) {
      if (
        recommendation.dayId &&
        !context.selectedItinerary.days.some(
          (day) => day.dayId === recommendation.dayId,
        )
      ) {
        rejected.push(
          `Recommendation ${index + 1}: referenced day is outside this trip.`,
        );
        return;
      }
      valid.push({
        ...recommendation,
        resolvedTitle: recommendation.title,
        storedCost: null,
        costVerified: false,
      });
      return;
    }

    if (recommendation.category === "GENERAL") {
      rejected.push(
        `Recommendation ${index + 1}: saved items require a concrete category.`,
      );
      return;
    }
    const item = contextItems(
      context,
      recommendation.category,
      recommendation.provenance === "EXISTING_SELECTED_ITEM",
    ).find((candidate) => candidate.id === recommendation.itemId);

    if (!item || item.dayId !== recommendation.dayId) {
      rejected.push(
        `Recommendation ${index + 1}: item ID, category, selection state, or day does not match this trip.`,
      );
      return;
    }
    valid.push({
      ...recommendation,
      title: itemTitle(item),
      resolvedTitle: itemTitle(item),
      storedCost: item.calculatedTripCost,
      costVerified: true,
    });
  });

  return {
    valid: mergeRecommendations(authoritativePrevious, valid),
    rejected,
  };
}

function recommendationKey(recommendation: ValidatedRecommendation) {
  if (
    recommendation.provenance === "EXISTING_OPTION" ||
    recommendation.provenance === "EXISTING_SELECTED_ITEM"
  ) {
    return `saved:${recommendation.itemId}`;
  }
  return `${recommendation.provenance}:${recommendation.category}:${recommendation.resolvedTitle.toLowerCase()}`;
}

function mergeRecommendations(
  previous: ValidatedRecommendation[],
  current: ValidatedRecommendation[],
) {
  const merged = new Map(
    previous.map((item) => [recommendationKey(item), item]),
  );
  for (const item of current) {
    const key = recommendationKey(item);
    const existing = merged.get(key);
    merged.set(key, existing ? { ...existing, reason: item.reason } : item);
  }
  return [...merged.values()].slice(0, 12);
}

export function selectedTarget(change: TripAiChange, context: TripChatContext) {
  if (change.type === "UPDATE_ACTIVITY" || change.type === "DELETE_ACTIVITY") {
    return contextItems(context, "ACTIVITY", true).find(
      (item) => item.id === change.activityId,
    );
  }
  if (change.type === "UPDATE_MEAL" || change.type === "DELETE_MEAL") {
    return contextItems(context, "MEAL", true).find(
      (item) => item.id === change.mealId,
    );
  }
  if (
    change.type === "UPDATE_TRANSPORT" ||
    change.type === "DELETE_TRANSPORT"
  ) {
    return contextItems(context, "TRANSPORT", true).find(
      (item) => item.id === change.transportId,
    );
  }
  if (change.type === "UPDATE_STAY" || change.type === "DELETE_STAY") {
    return contextItems(context, "STAY", true).find(
      (item) => item.id === change.stayId,
    );
  }
  return undefined;
}

export function sanitizeNewItemCost(change: TripAiChange): TripAiChange {
  if (change.type === "ADD_ACTIVITY") {
    return { ...change, data: { ...change.data, estimatedCost: null } };
  }
  if (change.type === "ADD_MEAL") {
    return { ...change, data: { ...change.data, estimatedCost: null } };
  }
  if (change.type === "ADD_TRANSPORT") {
    return {
      ...change,
      data: { ...change.data, pricePerPerson: null, totalCost: null },
    };
  }
  if (change.type === "ADD_STAY") {
    return {
      ...change,
      data: { ...change.data, pricePerNight: null, totalCost: null },
    };
  }
  return change;
}
