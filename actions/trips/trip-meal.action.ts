"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { recalculateTripCost } from "@/lib/trips/recalculate-trip-cost";

const mealTypeSchema = z.enum([
  "BREAKFAST",
  "LUNCH",
  "DINNER",
  "SNACK",
  "OTHER",
]);

const decimalInputSchema = z
  .union([z.string().trim(), z.number(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    const numberValue = Number(value);

    if (Number.isNaN(numberValue)) {
      return NaN;
    }

    return numberValue;
  })
  .refine((value) => value === null || !Number.isNaN(value), {
    message: "Cost must be a valid number.",
  })
  .refine((value) => value === null || value >= 0, {
    message: "Cost cannot be negative.",
  })
  .refine((value) => value === null || value <= 10_000_000, {
    message: "Cost is too high.",
  });

const createMealSuggestionSchema = z.object({
  tripId: z.string().trim().min(1, "Trip id is required."),
  tripDayId: z.string().trim().min(1, "Trip day id is required."),

  mealType: mealTypeSchema,

  title: z
    .string()
    .trim()
    .min(2, "Meal title must be at least 2 characters.")
    .max(120, "Meal title must be less than 120 characters."),

  locationName: z
    .string()
    .trim()
    .max(120, "Location must be less than 120 characters.")
    .optional()
    .nullable(),

  estimatedCost: decimalInputSchema,

  notes: z
    .string()
    .trim()
    .max(250, "Notes must be less than 250 characters.")
    .optional()
    .nullable(),
});

const updateMealSuggestionSchema = createMealSuggestionSchema.extend({
  mealSuggestionId: z.string().trim().min(1, "Meal id is required."),
});

const deleteMealSuggestionSchema = z.object({
  tripId: z.string().trim().min(1, "Trip id is required."),
  mealSuggestionId: z.string().trim().min(1, "Meal id is required."),
});

type CreateMealSuggestionInput = z.input<typeof createMealSuggestionSchema>;
type UpdateMealSuggestionInput = z.input<typeof updateMealSuggestionSchema>;
type DeleteMealSuggestionInput = z.infer<typeof deleteMealSuggestionSchema>;

function cleanText(value?: string | null) {
  return value?.trim() ? value.trim() : null;
}

function revalidateTripPages(tripId: string) {
  revalidatePath(`/dashboard/trips/${tripId}`);
  revalidatePath(`/dashboard/trips/${tripId}/edit`);
  revalidatePath("/dashboard/new");
}

async function verifyTripOwnership(tripId: string, userId: string) {
  return prisma.trip.findFirst({
    where: {
      id: tripId,
      userId,
    },
    select: {
      id: true,
    },
  });
}

async function verifyTripDayBelongsToTrip(tripDayId: string, tripId: string) {
  const tripDay = await prisma.tripDay.findFirst({
    where: {
      id: tripDayId,
      tripId,
    },
    select: {
      id: true,
    },
  });

  return Boolean(tripDay);
}

export async function createMealSuggestionAction(
  input: CreateMealSuggestionInput
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be logged in to add a meal.",
      };
    }

    const parsedInput = createMealSuggestionSchema.safeParse(input);

    if (!parsedInput.success) {
      return {
        success: false,
        message:
          parsedInput.error.issues[0]?.message ?? "Invalid meal information.",
      };
    }

    const {
      tripId,
      tripDayId,
      mealType,
      title,
      locationName,
      estimatedCost,
      notes,
    } = parsedInput.data;

    const trip = await verifyTripOwnership(tripId, session.user.id);

    if (!trip) {
      return {
        success: false,
        message: "Trip not found.",
      };
    }

    const isValidTripDay = await verifyTripDayBelongsToTrip(tripDayId, tripId);

    if (!isValidTripDay) {
      return {
        success: false,
        message: "Selected day does not belong to this trip.",
      };
    }

    const mealSuggestion = await prisma.mealSuggestion.create({
      data: {
        tripId,
        tripDayId,
        mealType,
        title,
        locationName: cleanText(locationName),
        estimatedCost,
        source: "USER_ADDED",
        notes: cleanText(notes),
      },
      select: {
        id: true,
        title: true,
        mealType: true,
      },
    });

    await recalculateTripCost(tripId);
    revalidateTripPages(tripId);

    return {
      success: true,
      message: "Meal added successfully.",
      mealSuggestion,
    };
  } catch (error) {
    console.error("CREATE_MEAL_SUGGESTION_ERROR", error);

    return {
      success: false,
      message: "Something went wrong while adding meal.",
    };
  }
}

export async function updateMealSuggestionAction(
  input: UpdateMealSuggestionInput
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be logged in to update this meal.",
      };
    }

    const parsedInput = updateMealSuggestionSchema.safeParse(input);

    if (!parsedInput.success) {
      return {
        success: false,
        message:
          parsedInput.error.issues[0]?.message ?? "Invalid meal information.",
      };
    }

    const {
      tripId,
      tripDayId,
      mealSuggestionId,
      mealType,
      title,
      locationName,
      estimatedCost,
      notes,
    } = parsedInput.data;

    const mealSuggestion = await prisma.mealSuggestion.findFirst({
      where: {
        id: mealSuggestionId,
        tripId,
        trip: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!mealSuggestion) {
      return {
        success: false,
        message: "Meal not found.",
      };
    }

    const isValidTripDay = await verifyTripDayBelongsToTrip(tripDayId, tripId);

    if (!isValidTripDay) {
      return {
        success: false,
        message: "Selected day does not belong to this trip.",
      };
    }

    await prisma.mealSuggestion.update({
      where: {
        id: mealSuggestionId,
      },
      data: {
        tripDayId,
        mealType,
        title,
        locationName: cleanText(locationName),
        estimatedCost,
        notes: cleanText(notes),
      },
    });

    await recalculateTripCost(tripId);
    revalidateTripPages(tripId);

    return {
      success: true,
      message: "Meal updated successfully.",
    };
  } catch (error) {
    console.error("UPDATE_MEAL_SUGGESTION_ERROR", error);

    return {
      success: false,
      message: "Something went wrong while updating meal.",
    };
  }
}

export async function deleteMealSuggestionAction(
  input: DeleteMealSuggestionInput
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be logged in to delete this meal.",
      };
    }

    const parsedInput = deleteMealSuggestionSchema.safeParse(input);

    if (!parsedInput.success) {
      return {
        success: false,
        message:
          parsedInput.error.issues[0]?.message ?? "Invalid meal information.",
      };
    }

    const { tripId, mealSuggestionId } = parsedInput.data;

    const mealSuggestion = await prisma.mealSuggestion.findFirst({
      where: {
        id: mealSuggestionId,
        tripId,
        trip: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!mealSuggestion) {
      return {
        success: false,
        message: "Meal not found.",
      };
    }

    await prisma.mealSuggestion.delete({
      where: {
        id: mealSuggestionId,
      },
    });

    await recalculateTripCost(tripId);
    revalidateTripPages(tripId);

    return {
      success: true,
      message: "Meal deleted successfully.",
    };
  } catch (error) {
    console.error("DELETE_MEAL_SUGGESTION_ERROR", error);

    return {
      success: false,
      message: "Something went wrong while deleting meal.",
    };
  }
}
