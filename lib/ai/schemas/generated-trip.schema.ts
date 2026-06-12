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

export const generatedTransportSchema = z.object({
  title: z.string().trim().min(1).max(120),
  mode: z.enum([
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
  ]),
  fromText: z.string().trim().max(160).nullable().optional(),
  toText: z.string().trim().max(160).nullable().optional(),
  description: z.string().trim().max(500).nullable().optional(),
  costType: z.enum(["PER_PERSON", "TOTAL"]).default("TOTAL"),
  pricePerPerson: moneySchema,
  totalCost: moneySchema,
  notes: z.string().trim().max(500).nullable().optional(),
});

export const generatedStaySchema = z.object({
  name: z.string().trim().min(1).max(140),
  city: z.string().trim().max(120).nullable().optional(),
  area: z.string().trim().max(120).nullable().optional(),
  stayType: z.enum([
    "HOTEL",
    "RESORT",
    "HOMESTAY",
    "HOUSEBOAT",
    "HOSTEL",
    "VILLA",
    "CAMP",
    "GUEST_HOUSE",
    "OTHER",
  ]),
  budgetLevel: z.enum(["BUDGET", "MID_RANGE", "PREMIUM", "LUXURY"]),
  pricePerNight: moneySchema,
  nights: z.number().int().min(0).nullable().optional(),
  totalCost: moneySchema,
  bestFor: z.string().trim().max(250).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
});

export const generatedMealSchema = z.object({
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK", "OTHER"]),
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
  category: z.enum([
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
  ]),
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