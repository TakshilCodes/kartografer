import { z } from "zod";

import { extractJsonFromAiText } from "@/lib/ai/ai-client";
import type { TripChatContext } from "./context";
import { MAX_TRIP_DAYS } from "@/lib/trips/trip-limits";

export const EXTENSION_DAY_TARGET = "EXTENSION_DAY" as const;
export const MAX_SEMANTIC_EDITS = 8;

const categorySchema = z.enum(["ACTIVITY", "MEAL", "TRANSPORT", "STAY"]);
const targetDaySchema = z.string().trim().min(1);
const reasonSchema = z.string().trim().min(1).max(400);
const nullableText = z.string().trim().max(700).nullable().optional();

const semanticItemContentSchema = z
  .object({
    title: z.string().trim().min(1).max(140).optional(),
    description: nullableText,
    locationName: z.string().trim().max(160).nullable().optional(),
    address: z.string().trim().max(240).nullable().optional(),
    startTime: z.string().trim().max(20).nullable().optional(),
    endTime: z.string().trim().max(20).nullable().optional(),
    durationMinutes: z.number().int().min(0).nullable().optional(),
    activityCategory: z
      .enum([
        "SIGHTSEEING",
        "ADVENTURE",
        "FOOD",
        "SHOPPING",
        "RELAXATION",
        "CULTURE",
        "RELIGIOUS",
        "NATURE",
        "TRANSPORT_BREAK",
        "HIDDEN_SPOT",
        "OTHER",
      ])
      .optional(),
    mealType: z
      .enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK", "OTHER"])
      .optional(),
    mode: z
      .enum([
        "FLIGHT",
        "TRAIN",
        "BUS",
        "CAB",
        "SELF_DRIVE",
        "WALK",
        "BIKE",
        "FERRY",
        "METRO",
        "MIXED",
        "OTHER",
      ])
      .optional(),
    fromText: z.string().trim().max(160).nullable().optional(),
    toText: z.string().trim().max(160).nullable().optional(),
    costType: z.enum(["PER_PERSON", "TOTAL"]).optional(),
    city: z.string().trim().max(120).nullable().optional(),
    area: z.string().trim().max(120).nullable().optional(),
    stayType: z
      .enum([
        "HOTEL",
        "RESORT",
        "HOMESTAY",
        "HOUSEBOAT",
        "HOSTEL",
        "VILLA",
        "CAMP",
        "GUEST_HOUSE",
        "OTHER",
      ])
      .optional(),
    budgetLevel: z
      .enum(["BUDGET", "MID_RANGE", "PREMIUM", "LUXURY"])
      .optional(),
    nights: z.number().int().min(0).nullable().optional(),
    bestFor: z.string().trim().max(250).nullable().optional(),
    notes: nullableText,
    position: z.number().int().min(0).optional(),
  })
  .strict();

const dayContentSchema = z
  .object({
    title: z.string().trim().min(1).max(140).optional(),
    description: nullableText,
    notes: nullableText,
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one day field is required.",
  });

export const semanticTripExtensionSchema = z
  .object({
    title: z.string().trim().min(1).max(140),
    description: nullableText,
    notes: nullableText,
    reason: reasonSchema,
  })
  .strict();

const moveSelectedItemSchema = z
  .object({
    type: z.literal("MOVE_SELECTED_ITEM"),
    itemId: z.string().trim().min(1),
    targetDay: targetDaySchema,
    reason: reasonSchema,
  })
  .strict();

const useSavedOptionSchema = z
  .object({
    type: z.literal("USE_SAVED_OPTION"),
    optionId: z.string().trim().min(1),
    targetDay: targetDaySchema,
    replaceItemId: z.string().trim().min(1).nullable().optional(),
    reason: reasonSchema,
  })
  .strict();

const addItemSchema = z
  .object({
    type: z.literal("ADD_ITEM"),
    category: categorySchema,
    targetDay: targetDaySchema,
    content: semanticItemContentSchema,
    // A rounded planning estimate, not a saved or live-verified price.
    approximateCost: z.number().finite().min(0).max(10_000_000).optional(),
    reason: reasonSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (!value.content.title) {
      context.addIssue({
        code: "custom",
        path: ["content", "title"],
        message: "A title is required.",
      });
    }
    if (value.category === "ACTIVITY" && !value.content.activityCategory) {
      context.addIssue({
        code: "custom",
        path: ["content", "activityCategory"],
        message: "An activity category is required.",
      });
    }
    if (value.category === "MEAL" && !value.content.mealType) {
      context.addIssue({
        code: "custom",
        path: ["content", "mealType"],
        message: "A meal type is required.",
      });
    }
    if (value.category === "TRANSPORT" && !value.content.mode) {
      context.addIssue({
        code: "custom",
        path: ["content", "mode"],
        message: "A transport mode is required.",
      });
    }
  });

const updateSelectedItemSchema = z
  .object({
    type: z.literal("UPDATE_SELECTED_ITEM"),
    itemId: z.string().trim().min(1),
    content: semanticItemContentSchema,
    // Used only when the user explicitly asks to correct an existing item's
    // price. The compiler maps this single semantic value to the category's
    // existing stored price field.
    approximateCost: z.number().finite().min(0).max(10_000_000).optional(),
    reason: reasonSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (
      Object.keys(value.content).length === 0 &&
      value.approximateCost === undefined
    ) {
      context.addIssue({
        code: "custom",
        path: ["content"],
        message: "Include a changed item field or approximateCost.",
      });
    }
  });

const removeSelectedItemSchema = z
  .object({
    type: z.literal("REMOVE_SELECTED_ITEM"),
    itemId: z.string().trim().min(1),
    reason: reasonSchema,
  })
  .strict();

const updateDaySchema = z
  .object({
    type: z.literal("UPDATE_DAY"),
    dayId: z.string().trim().min(1),
    content: dayContentSchema,
    reason: reasonSchema,
  })
  .strict();

export const semanticTripEditSchema = z.discriminatedUnion("type", [
  moveSelectedItemSchema,
  useSavedOptionSchema,
  addItemSchema,
  updateSelectedItemSchema,
  removeSelectedItemSchema,
  updateDaySchema,
]);

export const semanticTripPlanSchema = z
  .object({
    extendTrip: semanticTripExtensionSchema.nullable(),
    edits: z.array(semanticTripEditSchema).max(MAX_SEMANTIC_EDITS),
  })
  .strict()
  .refine(
    (value) =>
      value.edits.length + (value.extendTrip ? 1 : 0) <= MAX_SEMANTIC_EDITS,
    {
      message: `A proposal can contain at most ${MAX_SEMANTIC_EDITS} total changes.`,
    },
  );

export const semanticTripProposalResponseSchema = z
  .object({
    assistantMessage: z.string().trim().min(1).max(4000),
    plan: semanticTripPlanSchema,
  })
  .strict();

export const semanticTripAnswerResponseSchema = z
  .object({
    assistantMessage: z.string().trim().min(1).max(4000),
    recommendations: z.array(z.unknown()).max(12).default([]),
  })
  .strict();

export type SemanticTripEdit = z.infer<typeof semanticTripEditSchema>;
export type SemanticTripPlan = z.infer<typeof semanticTripPlanSchema>;
export type SemanticTripProposalResponse = z.infer<
  typeof semanticTripProposalResponseSchema
>;

export type DayExtensionCapability =
  | { mode: "REUSE_BLANK_FINAL_DAY"; dayId: string; dayNumber: number }
  | { mode: "ADD_NEW_DAY"; nextDayNumber: number }
  | { mode: "BLOCKED_MAX_DAYS"; maxDays: number };

export type SemanticTripChatContext = TripChatContext & {
  editCapabilities: { dayExtension: DayExtensionCapability };
};

export function addTripChatEditCapabilities(
  context: TripChatContext,
): SemanticTripChatContext {
  const days = [...context.selectedItinerary.days].sort(
    (left, right) => left.dayNumber - right.dayNumber,
  );
  const finalDay = days.at(-1);
  const reusableBlankFinalDay = Boolean(
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

  let dayExtension: DayExtensionCapability;
  if (finalDay && reusableBlankFinalDay) {
    dayExtension = {
      mode: "REUSE_BLANK_FINAL_DAY",
      dayId: finalDay.dayId,
      dayNumber: finalDay.dayNumber,
    };
  } else {
    const highestDayNumber = Math.max(0, ...days.map((day) => day.dayNumber));
    const actualDayCount = Math.max(
      context.tripOverview.tripDays,
      days.length,
      highestDayNumber,
    );
    dayExtension =
      actualDayCount >= MAX_TRIP_DAYS
        ? { mode: "BLOCKED_MAX_DAYS", maxDays: MAX_TRIP_DAYS }
        : { mode: "ADD_NEW_DAY", nextDayNumber: highestDayNumber + 1 };
  }

  return { ...context, editCapabilities: { dayExtension } };
}

type JsonRecord = Record<string, unknown>;

export type ParsedTripChatProposal = {
  proposal: SemanticTripProposalResponse;
  issues: string[];
  rejectedEditReasons: string[];
  outputLength: number;
};

function zodIssuePaths(prefix: string, error: z.ZodError) {
  return error.issues.map((issue) => {
    const suffix = issue.path.length > 0 ? `.${issue.path.join(".")}` : "";
    return `${prefix}${suffix}: ${issue.message}`;
  });
}

function parseEnvelope(text: string): {
  value: JsonRecord | null;
  issues: string[];
} {
  try {
    const extracted = extractJsonFromAiText(text);
    return typeof extracted === "object" &&
      extracted !== null &&
      !Array.isArray(extracted)
      ? { value: extracted as JsonRecord, issues: [] }
      : { value: null, issues: ["response: expected a JSON object"] };
  } catch {
    return { value: null, issues: ["response: invalid JSON"] };
  }
}

function parseAssistantMessage(value: unknown) {
  const parsed = z.string().trim().min(1).max(4000).safeParse(value);
  return parsed.success
    ? { value: parsed.data, issues: [] as string[] }
    : { value: "", issues: zodIssuePaths("assistantMessage", parsed.error) };
}

const priceAliasFields = [
  "price",
  "cost",
  "estimatedCost",
  "totalCost",
  "pricePerPerson",
  "pricePerNight",
] as const;

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseModelPrice(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;

  const normalized = value
    .trim()
    .replace(/^(?:₹|INR|Rs\.?)\s*/i, "")
    .replace(/\s*(?:₹|INR|Rs\.?)$/i, "")
    .replace(/,/g, "");
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

// Gemini occasionally puts a price in `content.price` (or sends `content: null`)
// even though the semantic contract uses a top-level `approximateCost`. This is a
// model-shape compatibility step only: the existing Zod schema, item grounding,
// review card, and apply-time validation still decide whether it can be applied.
function normalizeSemanticEdit(rawEdit: unknown): unknown {
  if (!isJsonRecord(rawEdit) || rawEdit.type !== "UPDATE_SELECTED_ITEM") {
    return rawEdit;
  }

  const edit = { ...rawEdit };
  const rawContent = edit.content;
  const content = isJsonRecord(rawContent) ? { ...rawContent } : {};
  const candidates: unknown[] = [edit.approximateCost, rawContent];

  for (const field of priceAliasFields) {
    candidates.push(edit[field], content[field]);
    delete edit[field];
    delete content[field];
  }
  candidates.push(content.approximateCost);
  delete content.approximateCost;

  const price = candidates
    .map(parseModelPrice)
    .find((candidate) => candidate !== undefined);
  if (price !== undefined) edit.approximateCost = price;

  // An empty content object is valid for a price-only correction. Keep malformed
  // non-object content unchanged unless a usable price made the intent unambiguous.
  if (isJsonRecord(edit.content) || price !== undefined) {
    edit.content = content;
  }

  return edit;
}

export function parseTripChatProposalResponse(
  text: string,
): ParsedTripChatProposal {
  const envelope = parseEnvelope(text);
  const empty: SemanticTripProposalResponse = {
    assistantMessage: "",
    plan: { extendTrip: null, edits: [] },
  };
  if (!envelope.value) {
    return {
      proposal: empty,
      issues: envelope.issues,
      rejectedEditReasons: envelope.issues,
      outputLength: text.length,
    };
  }
  const message = parseAssistantMessage(envelope.value.assistantMessage);
  const issues = [...message.issues];
  const rejectedEditReasons: string[] = [];
  const rawPlan = envelope.value.plan;
  if (
    typeof rawPlan !== "object" ||
    rawPlan === null ||
    Array.isArray(rawPlan)
  ) {
    const reason = "plan: expected an object";
    return {
      proposal: { ...empty, assistantMessage: message.value },
      issues: [...issues, reason],
      rejectedEditReasons: [reason],
      outputLength: text.length,
    };
  }
  const plan = rawPlan as JsonRecord;
  const extension = semanticTripExtensionSchema
    .nullable()
    .safeParse(plan.extendTrip ?? null);
  const validExtension = extension.success ? extension.data : null;
  if (!extension.success) {
    const reasons = zodIssuePaths("plan.extendTrip", extension.error);
    issues.push(...reasons);
    rejectedEditReasons.push(`Day extension: ${reasons.join("; ")}`);
  }

  const edits: SemanticTripEdit[] = [];
  const editLimit = validExtension
    ? MAX_SEMANTIC_EDITS - 1
    : MAX_SEMANTIC_EDITS;
  if (!Array.isArray(plan.edits)) {
    const reason = "plan.edits: expected an array";
    issues.push(reason);
    rejectedEditReasons.push(reason);
  } else {
    plan.edits.slice(0, editLimit).forEach((rawEdit, index) => {
      const parsed = semanticTripEditSchema.safeParse(
        normalizeSemanticEdit(rawEdit),
      );
      if (parsed.success) {
        edits.push(parsed.data);
      } else {
        const reasons = zodIssuePaths(`plan.edits.${index}`, parsed.error);
        issues.push(...reasons);
        rejectedEditReasons.push(`Edit ${index + 1}: ${reasons.join("; ")}`);
      }
    });
    if (plan.edits.length > editLimit) {
      const overflow = plan.edits.length - editLimit;
      const reason = `plan.edits: ${overflow} ${
        overflow === 1 ? "entry" : "entries"
      } exceeded the ${MAX_SEMANTIC_EDITS}-total-change limit`;
      issues.push(reason);
      for (let index = 0; index < overflow; index += 1) {
        rejectedEditReasons.push(
          `Edit ${editLimit + index + 1}: exceeds the ${MAX_SEMANTIC_EDITS}-total-change limit.`,
        );
      }
    }
  }

  return {
    proposal: {
      assistantMessage: message.value,
      plan: { extendTrip: validExtension, edits },
    },
    issues,
    rejectedEditReasons,
    outputLength: text.length,
  };
}

export function buildSemanticProposalRepairPrompt({
  originalPrompt,
  rejectionReasons,
  previousPlan,
}: {
  originalPrompt: string;
  rejectionReasons: string[];
  previousPlan?: SemanticTripPlan;
}) {
  const reasons = rejectionReasons.slice(0, 12);
  const previousChoices =
    previousPlan && (previousPlan.extendTrip || previousPlan.edits.length > 0)
      ? JSON.stringify({
          extendTrip: previousPlan.extendTrip
            ? { title: previousPlan.extendTrip.title }
            : null,
          edits: previousPlan.edits.map((edit) => {
            if (edit.type === "ADD_ITEM") {
              return {
                type: edit.type,
                category: edit.category,
                targetDay: edit.targetDay,
                title: edit.content.title,
              };
            }
            if (edit.type === "USE_SAVED_OPTION") {
              return {
                type: edit.type,
                optionId: edit.optionId,
                targetDay: edit.targetDay,
                replaceItemId: edit.replaceItemId ?? null,
              };
            }
            if (edit.type === "MOVE_SELECTED_ITEM") {
              return {
                type: edit.type,
                itemId: edit.itemId,
                targetDay: edit.targetDay,
              };
            }
            if (edit.type === "UPDATE_SELECTED_ITEM") {
              return {
                type: edit.type,
                itemId: edit.itemId,
                fields: Object.keys(edit.content),
              };
            }
            if (edit.type === "REMOVE_SELECTED_ITEM") {
              return { type: edit.type, itemId: edit.itemId };
            }
            return {
              type: edit.type,
              dayId: edit.dayId,
              fields: Object.keys(edit.content),
            };
          }),
        })
      : null;

  return `${originalPrompt}

The previous response could not be compiled into a safe review proposal.
Correct these fields:
${
  reasons.length > 0
    ? reasons.map((reason) => `- ${reason}`).join("\n")
    : "- plan.edits did not contain a usable edit"
}
${
  previousChoices
    ? `Previously parsed valid choices (preserve these when correcting their fields):
${previousChoices}`
    : "No previous semantic choice could be safely parsed; choose grounded items from the supplied context."
}

Return corrected semantic proposal JSON only. Use real IDs from context or EXTENSION_DAY. Do not return database action names, source-day fields, labels, totals, or provenance. For an explicit price correction use UPDATE_SELECTED_ITEM with content: {} and top-level approximateCost; never put a price field inside content.`;
}
