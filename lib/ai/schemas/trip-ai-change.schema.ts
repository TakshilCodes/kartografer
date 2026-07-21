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
const mealTypeSchema = z.enum([
  "BREAKFAST",
  "LUNCH",
  "DINNER",
  "SNACK",
  "OTHER",
]);
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
const aiEstimatedCostSchema = z
  .number()
  .finite()
  .min(0)
  .max(10_000_000)
  .optional();
const addChangeSchema = baseChangeSchema.extend({
  // Planning-only estimate: never a stored or verified price.
  aiEstimatedCost: aiEstimatedCostSchema,
});
const dayRefSchema = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .regex(
    /^[A-Za-z0-9_-]+$/,
    "Day references may contain only letters, numbers, underscores, and hyphens.",
  );
const existingOrNewDayTargetFields = {
  dayId: z.string().trim().min(1).optional(),
  dayRef: dayRefSchema.optional(),
};
const targetDayFields = {
  targetDayId: z.string().trim().min(1).optional(),
  targetDayRef: dayRefSchema.optional(),
};

function requireExactlyOneDayTarget<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
) {
  return schema.refine(
    (value) => {
      const target = value as { dayId?: unknown; dayRef?: unknown };
      return (
        Number(Boolean(target.dayId)) + Number(Boolean(target.dayRef)) === 1
      );
    },
    { message: "Use exactly one of dayId or dayRef." },
  );
}

function allowAtMostOneTargetDay<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
) {
  return schema.refine(
    (value) => {
      const target = value as { targetDayId?: unknown; targetDayRef?: unknown };
      return (
        Number(Boolean(target.targetDayId)) +
          Number(Boolean(target.targetDayRef)) <=
        1
      );
    },
    { message: "Use at most one of targetDayId or targetDayRef." },
  );
}

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

const addActivitySchema = requireExactlyOneDayTarget(
  addChangeSchema.extend({
    type: z.literal("ADD_ACTIVITY"),
    ...existingOrNewDayTargetFields,
    data: activityDataSchema.required({ title: true, category: true }),
  }),
);
const updateActivitySchema = baseChangeSchema.extend({
  type: z.literal("UPDATE_ACTIVITY"),
  activityId: z.string().trim().min(1),
  data: activityDataSchema
    .partial()
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one activity field is required.",
    ),
});
const deleteActivitySchema = baseChangeSchema.extend({
  type: z.literal("DELETE_ACTIVITY"),
  activityId: z.string().trim().min(1),
});
const addMealSchema = requireExactlyOneDayTarget(
  addChangeSchema.extend({
    type: z.literal("ADD_MEAL"),
    ...existingOrNewDayTargetFields,
    data: mealDataSchema.required({ mealType: true, title: true }),
  }),
);
const updateMealSchema = baseChangeSchema.extend({
  type: z.literal("UPDATE_MEAL"),
  mealId: z.string().trim().min(1),
  data: mealDataSchema
    .partial()
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one meal field is required.",
    ),
});
const deleteMealSchema = baseChangeSchema.extend({
  type: z.literal("DELETE_MEAL"),
  mealId: z.string().trim().min(1),
});
const addTransportSchema = requireExactlyOneDayTarget(
  addChangeSchema.extend({
    type: z.literal("ADD_TRANSPORT"),
    ...existingOrNewDayTargetFields,
    data: transportDataSchema.required({ title: true, mode: true }),
  }),
);
const updateTransportSchema = baseChangeSchema.extend({
  type: z.literal("UPDATE_TRANSPORT"),
  transportId: z.string().trim().min(1),
  data: transportDataSchema
    .partial()
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one transport field is required.",
    ),
});
const deleteTransportSchema = baseChangeSchema.extend({
  type: z.literal("DELETE_TRANSPORT"),
  transportId: z.string().trim().min(1),
});
const addStaySchema = requireExactlyOneDayTarget(
  addChangeSchema.extend({
    type: z.literal("ADD_STAY"),
    ...existingOrNewDayTargetFields,
    data: stayDataSchema.required({ name: true }),
  }),
);
const updateStaySchema = baseChangeSchema.extend({
  type: z.literal("UPDATE_STAY"),
  stayId: z.string().trim().min(1),
  data: stayDataSchema
    .partial()
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one stay field is required.",
    ),
});
const deleteStaySchema = baseChangeSchema.extend({
  type: z.literal("DELETE_STAY"),
  stayId: z.string().trim().min(1),
});
const updateDaySchema = baseChangeSchema.extend({
  type: z.literal("UPDATE_DAY"),
  dayId: z.string().trim().min(1),
  data: updateDayDataSchema.refine(
    (data) => Object.keys(data).length > 0,
    "At least one day field is required.",
  ),
});

const addDaySchema = baseChangeSchema.extend({
  type: z.literal("ADD_DAY"),
  dayRef: dayRefSchema,
  data: z
    .object({
      title: z.string().trim().min(1).max(140).optional(),
      description: nullableStringSchema,
      notes: nullableStringSchema,
    })
    .strict(),
});

const moveItineraryItemSchema = baseChangeSchema
  .extend({
    type: z.literal("MOVE_ITINERARY_ITEM"),
    category: z.enum(["ACTIVITY", "MEAL", "TRANSPORT", "STAY"]),
    itemId: z.string().trim().min(1),
    fromDayId: z.string().trim().min(1),
    ...targetDayFields,
  })
  .refine(
    (value) =>
      Number(Boolean(value.targetDayId)) +
        Number(Boolean(value.targetDayRef)) ===
      1,
    { message: "Use exactly one targetDayId or targetDayRef." },
  );

function optionSelectionSchema<T extends string>(type: T) {
  return allowAtMostOneTargetDay(
    baseChangeSchema.extend({
      type: z.literal(type),
      optionId: z.string().trim().min(1),
      dayId: z.string().trim().min(1),
      ...targetDayFields,
      replaceSelectedItemId: z.string().trim().min(1).nullable().optional(),
    }),
  );
}

const selectActivityOptionSchema = optionSelectionSchema(
  "SELECT_ACTIVITY_OPTION",
);
const selectMealOptionSchema = optionSelectionSchema("SELECT_MEAL_OPTION");
const selectTransportOptionSchema = optionSelectionSchema(
  "SELECT_TRANSPORT_OPTION",
);
const selectStayOptionSchema = optionSelectionSchema("SELECT_STAY_OPTION");

export const tripAiChangeSchema = z.union([
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
  addDaySchema,
  updateDaySchema,
  moveItineraryItemSchema,
  selectActivityOptionSchema,
  selectMealOptionSchema,
  selectTransportOptionSchema,
  selectStayOptionSchema,
]);

export const recommendationCategorySchema = z.enum([
  "ACTIVITY",
  "MEAL",
  "TRANSPORT",
  "STAY",
  "GENERAL",
]);
export const recommendationProvenanceSchema = z.enum([
  "EXISTING_SELECTED_ITEM",
  "EXISTING_OPTION",
  "NEW_AI_SUGGESTION",
  "LIVE_INFORMATION_REQUIRED",
]);

const recommendationBaseSchema = z.object({
  category: recommendationCategorySchema,
  title: z.string().trim().min(1).max(180),
  reason: z.string().trim().min(1).max(500),
});

export const tripAiRecommendationSchema = z.discriminatedUnion("provenance", [
  recommendationBaseSchema
    .extend({
      provenance: z.literal("EXISTING_SELECTED_ITEM"),
      itemId: z.string().trim().min(1),
      dayId: z.string().trim().min(1),
    })
    .strict(),
  recommendationBaseSchema
    .extend({
      provenance: z.literal("EXISTING_OPTION"),
      itemId: z.string().trim().min(1),
      dayId: z.string().trim().min(1),
    })
    .strict(),
  recommendationBaseSchema
    .extend({
      provenance: z.literal("NEW_AI_SUGGESTION"),
      dayId: z.string().trim().min(1).nullable().optional(),
    })
    .strict(),
  recommendationBaseSchema
    .extend({
      provenance: z.literal("LIVE_INFORMATION_REQUIRED"),
      dayId: z.string().trim().min(1).nullable().optional(),
    })
    .strict(),
]);

export const tripAiChangeProposalSchema = z.object({
  summary: z.string().trim().max(500).nullable().optional(),
  changes: z.array(tripAiChangeSchema).max(8),
});

export type TripAiChange = z.infer<typeof tripAiChangeSchema>;
export type TripAiRecommendation = z.infer<typeof tripAiRecommendationSchema>;
export type TripAiChangeProposal = z.infer<typeof tripAiChangeProposalSchema>;
