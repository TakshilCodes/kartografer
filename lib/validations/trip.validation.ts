import { z } from "zod";

import {
  countNonWhitespaceCharacters,
  MAX_SPECIAL_NOTES_LENGTH,
  MAX_TRIP_DAYS,
  MAX_TRIP_PEOPLE,
} from "@/lib/trips/trip-limits";

const optionalNotes = z
  .string()
  .trim()
  .refine(
    (value) =>
      countNonWhitespaceCharacters(value) <= MAX_SPECIAL_NOTES_LENGTH,
    `Special notes cannot be more than ${MAX_SPECIAL_NOTES_LENGTH} characters, excluding spaces.`
  )
  .optional()
  .or(z.literal(""));

const budgetSchema = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }

    return value;
  },
  z.coerce
    .number()
    .min(0, "Budget cannot be negative.")
    .max(5_000_000, "Budget is too high.")
    .optional()
);

const placeOptionSchema = z.object({
  provider: z.enum(["MANUAL", "GEOAPIFY", "MAPBOX", "GOOGLE", "NOMINATIM"]),

  providerPlaceId: z.string().trim().min(1, "Place id is required."),

  name: z.string().trim().min(1, "Place name is required."),

  formattedName: z
    .string()
    .trim()
    .min(1, "Formatted place name is required."),

  city: z.string().trim().nullable().optional(),

  state: z.string().trim().nullable().optional(),

  country: z.string().trim().min(1, "Country is required."),

  countryCode: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .refine((value) => value === "IN", {
      message: "Only India places are supported in V1.",
    }),

  lat: z.number().nullable().optional(),

  lng: z.number().nullable().optional(),
});

const placeJsonSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string" || !value.trim()) {
      return null;
    }

    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  },
  placeOptionSchema.nullable()
);

export const createTripSchema = z.object({
  fromPlace: placeJsonSchema.refine((value) => value !== null, {
    message: "Please select a starting place from the dropdown.",
  }),

  toPlace: placeJsonSchema.refine((value) => value !== null, {
    message: "Please select a destination from the dropdown.",
  }),

  days: z.coerce
    .number()
    .int("Number of days must be a whole number.")
    .min(1, "Trip must be at least 1 day.")
    .max(
      MAX_TRIP_DAYS,
      `Trips cannot be more than ${MAX_TRIP_DAYS} days.`
    ),

  people: z.coerce
    .number()
    .int("People count must be a whole number.")
    .min(1, "At least 1 person is required.")
    .max(
      MAX_TRIP_PEOPLE,
      `A trip cannot have more than ${MAX_TRIP_PEOPLE} people.`
    ),

  budget: budgetSchema,

  tripType: z
    .enum([
      "Family Trip",
      "Adventure",
      "Relaxed Vacation",
      "Road Trip",
      "Religious Trip",
      "Budget Trip",
    ])
    .optional()
    .default("Family Trip"),

  transport: z
    .enum(["Any", "Train", "Flight", "Cab", "Bus", "Self Drive"])
    .optional()
    .default("Any"),

  food: z
    .enum(["Vegetarian", "Non-Vegetarian", "Jain", "Any"])
    .optional()
    .default("Any"),

  pace: z
    .enum(["Relaxed", "Balanced", "Fast"])
    .optional()
    .default("Balanced"),

  notes: optionalNotes,
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
