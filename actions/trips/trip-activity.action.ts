"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { recalculateTripCost } from "@/lib/trips/recalculate-trip-cost";

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

const intInputSchema = z
  .union([z.string().trim(), z.number(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    const numberValue = Number(value);

    if (!Number.isInteger(numberValue)) {
      return NaN;
    }

    return numberValue;
  })
  .refine((value) => value === null || !Number.isNaN(value), {
    message: "Duration must be a valid number.",
  })
  .refine((value) => value === null || value >= 0, {
    message: "Duration cannot be negative.",
  })
  .refine((value) => value === null || value <= 1440, {
    message: "Duration is too high.",
  });

const createTripActivitySchema = z.object({
  tripId: z.string().trim().min(1, "Trip id is required."),
  tripDayId: z.string().trim().min(1, "Trip day id is required."),

  title: z
    .string()
    .trim()
    .min(2, "Activity title must be at least 2 characters.")
    .max(120, "Activity title must be less than 120 characters."),

  description: z
    .string()
    .trim()
    .max(250, "Description must be less than 250 characters.")
    .optional()
    .nullable(),

  locationName: z
    .string()
    .trim()
    .max(120, "Location name must be less than 120 characters.")
    .optional()
    .nullable(),

  address: z
    .string()
    .trim()
    .max(180, "Address must be less than 180 characters.")
    .optional()
    .nullable(),

  startTime: z
    .string()
    .trim()
    .max(20, "Start time must be less than 20 characters.")
    .optional()
    .nullable(),

  endTime: z
    .string()
    .trim()
    .max(20, "End time must be less than 20 characters.")
    .optional()
    .nullable(),

  durationMinutes: intInputSchema,

  category: activityCategorySchema.default("OTHER"),

  estimatedCost: decimalInputSchema,

  notes: z
    .string()
    .trim()
    .max(250, "Notes must be less than 250 characters.")
    .optional()
    .nullable(),

  position: z.number().int().min(0).optional(),
});

const updateTripActivitySchema = createTripActivitySchema.extend({
  activityId: z.string().trim().min(1, "Activity id is required."),
});

const deleteTripActivitySchema = z.object({
  tripId: z.string().trim().min(1, "Trip id is required."),
  activityId: z.string().trim().min(1, "Activity id is required."),
});

const selectTripActivitySchema = deleteTripActivitySchema;

type CreateTripActivityInput = z.input<typeof createTripActivitySchema>;
type UpdateTripActivityInput = z.input<typeof updateTripActivitySchema>;
type DeleteTripActivityInput = z.infer<typeof deleteTripActivitySchema>;
type SelectTripActivityInput = z.infer<typeof selectTripActivitySchema>;

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

export async function createTripActivityAction(
  input: CreateTripActivityInput
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be logged in to add an activity.",
      };
    }

    const parsedInput = createTripActivitySchema.safeParse(input);

    if (!parsedInput.success) {
      return {
        success: false,
        message:
          parsedInput.error.issues[0]?.message ??
          "Invalid activity information.",
      };
    }

    const {
      tripId,
      tripDayId,
      title,
      description,
      locationName,
      address,
      startTime,
      endTime,
      durationMinutes,
      category,
      estimatedCost,
      notes,
      position,
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

    const lastActivity = await prisma.tripActivity.findFirst({
      where: {
        tripId,
        tripDayId,
      },
      orderBy: {
        position: "desc",
      },
      select: {
        position: true,
      },
    });

    const activity = await prisma.tripActivity.create({
      data: {
        tripId,
        tripDayId,
        title,
        description: cleanText(description),
        locationName: cleanText(locationName),
        address: cleanText(address),
        startTime: cleanText(startTime),
        endTime: cleanText(endTime),
        durationMinutes,
        category,
        estimatedCost,
        source: "USER_ADDED",
        notes: cleanText(notes),
        position: position ?? (lastActivity?.position ?? -1) + 1,
      },
      select: {
        id: true,
        title: true,
        category: true,
      },
    });

    await recalculateTripCost(tripId);
    revalidateTripPages(tripId);

    return {
      success: true,
      message: "Activity added successfully.",
      activity,
    };
  } catch (error) {
    console.error("CREATE_TRIP_ACTIVITY_ERROR", error);

    return {
      success: false,
      message: "Something went wrong while adding activity.",
    };
  }
}

export async function updateTripActivityAction(
  input: UpdateTripActivityInput
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be logged in to update this activity.",
      };
    }

    const parsedInput = updateTripActivitySchema.safeParse(input);

    if (!parsedInput.success) {
      return {
        success: false,
        message:
          parsedInput.error.issues[0]?.message ??
          "Invalid activity information.",
      };
    }

    const {
      tripId,
      tripDayId,
      activityId,
      title,
      description,
      locationName,
      address,
      startTime,
      endTime,
      durationMinutes,
      category,
      estimatedCost,
      notes,
      position,
    } = parsedInput.data;

    const activity = await prisma.tripActivity.findFirst({
      where: {
        id: activityId,
        tripId,
        trip: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!activity) {
      return {
        success: false,
        message: "Activity not found.",
      };
    }

    const isValidTripDay = await verifyTripDayBelongsToTrip(tripDayId, tripId);

    if (!isValidTripDay) {
      return {
        success: false,
        message: "Selected day does not belong to this trip.",
      };
    }

    await prisma.tripActivity.update({
      where: {
        id: activityId,
      },
      data: {
        tripDayId,
        title,
        description: cleanText(description),
        locationName: cleanText(locationName),
        address: cleanText(address),
        startTime: cleanText(startTime),
        endTime: cleanText(endTime),
        durationMinutes,
        category,
        estimatedCost,
        notes: cleanText(notes),
        ...(typeof position === "number" ? { position } : {}),
      },
    });

    await recalculateTripCost(tripId);
    revalidateTripPages(tripId);

    return {
      success: true,
      message: "Activity updated successfully.",
    };
  } catch (error) {
    console.error("UPDATE_TRIP_ACTIVITY_ERROR", error);

    return {
      success: false,
      message: "Something went wrong while updating activity.",
    };
  }
}

export async function deleteTripActivityAction(
  input: DeleteTripActivityInput
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be logged in to delete this activity.",
      };
    }

    const parsedInput = deleteTripActivitySchema.safeParse(input);

    if (!parsedInput.success) {
      return {
        success: false,
        message:
          parsedInput.error.issues[0]?.message ??
          "Invalid activity information.",
      };
    }

    const { tripId, activityId } = parsedInput.data;

    const activity = await prisma.tripActivity.findFirst({
      where: {
        id: activityId,
        tripId,
        trip: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!activity) {
      return {
        success: false,
        message: "Activity not found.",
      };
    }

    await prisma.tripActivity.delete({
      where: {
        id: activityId,
      },
    });

    await recalculateTripCost(tripId);
    revalidateTripPages(tripId);

    return {
      success: true,
      message: "Activity deleted successfully.",
    };
  } catch (error) {
    console.error("DELETE_TRIP_ACTIVITY_ERROR", error);

    return {
      success: false,
      message: "Something went wrong while deleting activity.",
    };
  }
}

export async function selectTripActivityAction(
  input: SelectTripActivityInput
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be logged in to add this activity to the plan.",
      };
    }

    const parsedInput = selectTripActivitySchema.safeParse(input);

    if (!parsedInput.success) {
      return {
        success: false,
        message:
          parsedInput.error.issues[0]?.message ??
          "Invalid activity information.",
      };
    }

    const { tripId, activityId } = parsedInput.data;

    const activity = await prisma.tripActivity.findFirst({
      where: {
        id: activityId,
        tripId,
        trip: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!activity) {
      return {
        success: false,
        message: "Activity not found.",
      };
    }

    await prisma.tripActivity.update({
      where: {
        id: activityId,
      },
      data: {
        isSelected: true,
      },
    });

    await recalculateTripCost(tripId);
    revalidateTripPages(tripId);

    return {
      success: true,
      message: "Activity added to final itinerary.",
    };
  } catch (error) {
    console.error("SELECT_TRIP_ACTIVITY_ERROR", error);

    return {
      success: false,
      message: "Something went wrong while adding activity to the plan.",
    };
  }
}

export async function unselectTripActivityAction(
  input: SelectTripActivityInput
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be logged in to move this activity to options.",
      };
    }

    const parsedInput = selectTripActivitySchema.safeParse(input);

    if (!parsedInput.success) {
      return {
        success: false,
        message:
          parsedInput.error.issues[0]?.message ??
          "Invalid activity information.",
      };
    }

    const { tripId, activityId } = parsedInput.data;

    const activity = await prisma.tripActivity.findFirst({
      where: {
        id: activityId,
        tripId,
        trip: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!activity) {
      return {
        success: false,
        message: "Activity not found.",
      };
    }

    await prisma.tripActivity.update({
      where: {
        id: activityId,
      },
      data: {
        isSelected: false,
      },
    });

    await recalculateTripCost(tripId);
    revalidateTripPages(tripId);

    return {
      success: true,
      message: "Activity moved to options.",
    };
  } catch (error) {
    console.error("UNSELECT_TRIP_ACTIVITY_ERROR", error);

    return {
      success: false,
      message: "Something went wrong while moving activity to options.",
    };
  }
}
