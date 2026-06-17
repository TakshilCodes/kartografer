import { z } from "zod";

const nullableStringSchema = z.string().trim().max(700).nullable().optional();
const moneySchema = z.number().min(0).nullable().optional();

const transportModeSchema = z.enum([
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
]);

const costTypeSchema = z.enum(["PER_PERSON", "TOTAL"]);

const stayTypeSchema = z.enum([
  "HOTEL",
  "RESORT",
  "HOMESTAY",
  "HOUSEBOAT",
  "HOSTEL",
  "VILLA",
  "CAMP",
  "GUEST_HOUSE",
  "OTHER",
]);

const budgetLevelSchema = z.enum(["BUDGET", "MID_RANGE", "PREMIUM", "LUXURY"]);
const mealTypeSchema = z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK", "OTHER"]);

const activityCategorySchema = z.enum([
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
]);

const baseChangeSchema = z.object({
  label: z.string().trim().min(1).max(160),
  reason: z.string().trim().min(1).max(400),
});

const updateDayDataSchema = z
  .object({
    title: z.string().trim().min(1).max(140).optional(),
    description: nullableStringSchema,
    notes: nullableStringSchema,
    estimatedCost: moneySchema,
  })
  .strict();

const activityDataSchema = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
    description: nullableStringSchema,
    locationName: z.string().trim().max(160).nullable().optional(),
    address: z.string().trim().max(240).nullable().optional(),
    startTime: z.string().trim().max(20).nullable().optional(),
    endTime: z.string().trim().max(20).nullable().optional(),
    durationMinutes: z.number().int().min(0).nullable().optional(),
    category: activityCategorySchema.optional(),
    estimatedCost: moneySchema,
    notes: nullableStringSchema,
    position: z.number().int().min(0).optional(),
  })
  .strict();

const mealDataSchema = z
  .object({
    mealType: mealTypeSchema.optional(),
    title: z.string().trim().min(1).max(140).optional(),
    locationName: z.string().trim().max(160).nullable().optional(),
    estimatedCost: moneySchema,
    notes: nullableStringSchema,
  })
  .strict();

const transportDataSchema = z
  .object({
    title: z.string().trim().min(1).max(140).optional(),
    mode: transportModeSchema.optional(),
    fromText: z.string().trim().max(160).nullable().optional(),
    toText: z.string().trim().max(160).nullable().optional(),
    description: nullableStringSchema,
    costType: costTypeSchema.optional(),
    pricePerPerson: moneySchema,
    totalCost: moneySchema,
    notes: nullableStringSchema,
  })
  .strict();

const stayDataSchema = z
  .object({
    name: z.string().trim().min(1).max(140).optional(),
    city: z.string().trim().max(120).nullable().optional(),
    area: z.string().trim().max(120).nullable().optional(),
    stayType: stayTypeSchema.optional(),
    budgetLevel: budgetLevelSchema.optional(),
    pricePerNight: moneySchema,
    nights: z.number().int().min(0).nullable().optional(),
    totalCost: moneySchema,
    bestFor: z.string().trim().max(250).nullable().optional(),
    notes: nullableStringSchema,
  })
  .strict();

const addActivitySchema = baseChangeSchema.extend({
  type: z.literal("ADD_ACTIVITY"),
  dayId: z.string().trim().min(1),
  data: activityDataSchema.required({
    title: true,
    category: true,
  }),
});

const updateActivitySchema = baseChangeSchema.extend({
  type: z.literal("UPDATE_ACTIVITY"),
  activityId: z.string().trim().min(1),
  data: activityDataSchema.partial().refine((data) => {
    return Object.keys(data).length > 0;
  }, "At least one activity field is required."),
});

const deleteActivitySchema = baseChangeSchema.extend({
  type: z.literal("DELETE_ACTIVITY"),
  activityId: z.string().trim().min(1),
});

const addMealSchema = baseChangeSchema.extend({
  type: z.literal("ADD_MEAL"),
  dayId: z.string().trim().min(1),
  data: mealDataSchema.required({
    mealType: true,
    title: true,
  }),
});

const updateMealSchema = baseChangeSchema.extend({
  type: z.literal("UPDATE_MEAL"),
  mealId: z.string().trim().min(1),
  data: mealDataSchema.partial().refine((data) => {
    return Object.keys(data).length > 0;
  }, "At least one meal field is required."),
});

const deleteMealSchema = baseChangeSchema.extend({
  type: z.literal("DELETE_MEAL"),
  mealId: z.string().trim().min(1),
});

const addTransportSchema = baseChangeSchema.extend({
  type: z.literal("ADD_TRANSPORT"),
  dayId: z.string().trim().min(1),
  data: transportDataSchema.required({
    title: true,
    mode: true,
  }),
});

const updateTransportSchema = baseChangeSchema.extend({
  type: z.literal("UPDATE_TRANSPORT"),
  transportId: z.string().trim().min(1),
  data: transportDataSchema.partial().refine((data) => {
    return Object.keys(data).length > 0;
  }, "At least one transport field is required."),
});

const deleteTransportSchema = baseChangeSchema.extend({
  type: z.literal("DELETE_TRANSPORT"),
  transportId: z.string().trim().min(1),
});

const addStaySchema = baseChangeSchema.extend({
  type: z.literal("ADD_STAY"),
  dayId: z.string().trim().min(1),
  data: stayDataSchema.required({
    name: true,
  }),
});

const updateStaySchema = baseChangeSchema.extend({
  type: z.literal("UPDATE_STAY"),
  stayId: z.string().trim().min(1),
  data: stayDataSchema.partial().refine((data) => {
    return Object.keys(data).length > 0;
  }, "At least one stay field is required."),
});

const deleteStaySchema = baseChangeSchema.extend({
  type: z.literal("DELETE_STAY"),
  stayId: z.string().trim().min(1),
});

const updateDaySchema = baseChangeSchema.extend({
  type: z.literal("UPDATE_DAY"),
  dayId: z.string().trim().min(1),
  data: updateDayDataSchema.refine((data) => {
    return Object.keys(data).length > 0;
  }, "At least one day field is required."),
});

export const tripAiChangeSchema = z.discriminatedUnion("type", [
  addActivitySchema,
  updateActivitySchema,
  deleteActivitySchema,
  addMealSchema,
  updateMealSchema,
  deleteMealSchema,
  addTransportSchema,
  updateTransportSchema,
  deleteTransportSchema,
  addStaySchema,
  updateStaySchema,
  deleteStaySchema,
  updateDaySchema,
]);

export const tripAiChangeResponseSchema = z.object({
  assistantMessage: z.string().trim().min(1).max(4000),
  proposedChanges: z.array(tripAiChangeSchema).max(8).default([]),
});

export const tripAiChangeProposalSchema = z.object({
  summary: z.string().trim().max(500).nullable().optional(),
  changes: z.array(tripAiChangeSchema).max(8),
});

export type TripAiChange = z.infer<typeof tripAiChangeSchema>;
export type TripAiChangeResponse = z.infer<typeof tripAiChangeResponseSchema>;
export type TripAiChangeProposal = z.infer<typeof tripAiChangeProposalSchema>;
