import { z } from "zod";

const moneySchema = z
  .number()
  .min(0, "Cost cannot be negative")
  .nullable()
  .optional();

const timeSchema = z
  .string()
  .trim()
  .nullable()
  .optional();

function normalizeEnumKey(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/&/g, "AND")
    .replace(/[\s/-]+/g, "_")
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function aiEnum<const TValues extends readonly [string, ...string[]]>(
  values: TValues,
  aliases: Partial<Record<string, TValues[number]>> = {}
) {
  const allowedValues = new Set<string>(values);

  return z.preprocess((value) => {
    if (typeof value !== "string") return value;

    const normalizedValue = normalizeEnumKey(value);

    return aliases[normalizedValue] ??
      (allowedValues.has(normalizedValue) ? normalizedValue : value);
  }, z.enum(values));
}

const transportModeSchema = aiEnum(
  [
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
  ],
  {
    AIR: "FLIGHT",
    AIRPLANE: "FLIGHT",
    CAR: "CAB",
    PRIVATE_CAR: "CAB",
    TAXI: "CAB",
    DRIVE: "SELF_DRIVE",
    SELFDRIVE: "SELF_DRIVE",
    WALKING: "WALK",
    BICYCLE: "BIKE",
    CYCLING: "BIKE",
    BOAT: "FERRY",
    SUBWAY: "METRO",
    LOCAL_TRAIN: "TRAIN",
  }
);

const costTypeSchema = aiEnum(["PER_PERSON", "TOTAL"], {
  PERPERSON: "PER_PERSON",
  PER_HEAD: "PER_PERSON",
  PER_PAX: "PER_PERSON",
  GROUP: "TOTAL",
  FOR_GROUP: "TOTAL",
});

const stayTypeSchema = aiEnum(
  [
    "HOTEL",
    "RESORT",
    "HOMESTAY",
    "HOUSEBOAT",
    "HOSTEL",
    "VILLA",
    "CAMP",
    "GUEST_HOUSE",
    "OTHER",
  ],
  {
    HOTELS: "HOTEL",
    BUSINESS_HOTEL: "HOTEL",
    BOUTIQUE_HOTEL: "HOTEL",
    HERITAGE_HOTEL: "HOTEL",
    LUXURY_HOTEL: "HOTEL",
    HOME_STAY: "HOMESTAY",
    HOUSE_BOAT: "HOUSEBOAT",
    GUESTHOUSE: "GUEST_HOUSE",
    GUEST_HOUSES: "GUEST_HOUSE",
    GUESTHOUSE_STAY: "GUEST_HOUSE",
    LODGE: "GUEST_HOUSE",
    DHARAMSHALA: "GUEST_HOUSE",
    CAMPING: "CAMP",
    CAMPSITE: "CAMP",
    TENT: "CAMP",
    COTTAGE: "HOMESTAY",
    APARTMENT: "OTHER",
    AIRBNB: "OTHER",
  }
);

const budgetLevelSchema = aiEnum(["BUDGET", "MID_RANGE", "PREMIUM", "LUXURY"], {
  LOW: "BUDGET",
  CHEAP: "BUDGET",
  ECONOMY: "BUDGET",
  MID: "MID_RANGE",
  MEDIUM: "MID_RANGE",
  STANDARD: "MID_RANGE",
  MODERATE: "MID_RANGE",
  HIGH: "PREMIUM",
  UPSCALE: "PREMIUM",
  EXPENSIVE: "LUXURY",
});

const mealTypeSchema = aiEnum(["BREAKFAST", "LUNCH", "DINNER", "SNACK", "OTHER"], {
  BRUNCH: "OTHER",
  EVENING_SNACK: "SNACK",
  TEA: "SNACK",
  DRINKS: "SNACK",
});

const activityCategorySchema = aiEnum(
  [
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
  ],
  {
    SIGHT_SEEING: "SIGHTSEEING",
    SCENIC: "NATURE",
    WILDLIFE: "NATURE",
    MUSEUM: "CULTURE",
    HERITAGE: "CULTURE",
    TEMPLE: "RELIGIOUS",
    PILGRIMAGE: "RELIGIOUS",
    DINING: "FOOD",
    RESTAURANT: "FOOD",
    OFFBEAT: "HIDDEN_SPOT",
    HIDDEN_GEM: "HIDDEN_SPOT",
    HIDDEN_PLACE: "HIDDEN_SPOT",
    REST_STOP: "TRANSPORT_BREAK",
    TRANSFER: "TRANSPORT_BREAK",
    TRAVEL: "TRANSPORT_BREAK",
  }
);

export const generatedTransportSchema = z.object({
  title: z.string().trim().min(1).max(120),
  mode: transportModeSchema,
  fromText: z.string().trim().max(160).nullable().optional(),
  toText: z.string().trim().max(160).nullable().optional(),
  description: z.string().trim().max(500).nullable().optional(),
  costType: costTypeSchema.default("TOTAL"),
  pricePerPerson: moneySchema,
  totalCost: moneySchema,
  notes: z.string().trim().max(500).nullable().optional(),
});

export const generatedStaySchema = z.object({
  name: z.string().trim().min(1).max(140),
  city: z.string().trim().max(120).nullable().optional(),
  area: z.string().trim().max(120).nullable().optional(),
  stayType: stayTypeSchema,
  budgetLevel: budgetLevelSchema,
  pricePerNight: moneySchema,
  nights: z.number().int().min(0).nullable().optional(),
  totalCost: moneySchema,
  bestFor: z.string().trim().max(250).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
});

export const generatedMealSchema = z.object({
  mealType: mealTypeSchema,
  title: z.string().trim().min(1).max(140),
  locationName: z.string().trim().max(160).nullable().optional(),
  estimatedCost: moneySchema,
  notes: z.string().trim().max(500).nullable().optional(),
});

export const generatedActivitySchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(700).nullable().optional(),
  locationName: z.string().trim().max(160).nullable().optional(),
  address: z.string().trim().max(240).nullable().optional(),
  startTime: timeSchema,
  endTime: timeSchema,
  durationMinutes: z.number().int().min(0).nullable().optional(),
  category: activityCategorySchema,
  estimatedCost: moneySchema,
  notes: z.string().trim().max(500).nullable().optional(),
  position: z.number().int().min(0).optional(),
});

export const generatedDayItemsSchema = z.object({
  transports: z.array(generatedTransportSchema).default([]),
  stays: z.array(generatedStaySchema).default([]),
  meals: z.array(generatedMealSchema).default([]),
  activities: z.array(generatedActivitySchema).default([]),
});

export const generatedTripDaySchema = z.object({
  dayNumber: z.number().int().min(1),
  title: z.string().trim().min(1).max(140),
  description: z.string().trim().max(1000).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),

  selected: generatedDayItemsSchema,
  options: generatedDayItemsSchema,
});

export const generatedTripSchema = z.object({
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().max(1500).nullable().optional(),
  days: z.array(generatedTripDaySchema).min(1),
});

export type GeneratedTransport = z.infer<typeof generatedTransportSchema>;
export type GeneratedStay = z.infer<typeof generatedStaySchema>;
export type GeneratedMeal = z.infer<typeof generatedMealSchema>;
export type GeneratedActivity = z.infer<typeof generatedActivitySchema>;
export type GeneratedDayItems = z.infer<typeof generatedDayItemsSchema>;
export type GeneratedTripDay = z.infer<typeof generatedTripDaySchema>;
export type GeneratedTrip = z.infer<typeof generatedTripSchema>;
