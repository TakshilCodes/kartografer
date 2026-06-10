"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { recalculateTripCost } from "@/lib/trips/recalculate-trip-cost";

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
    message: "Nights must be a valid number.",
  })
  .refine((value) => value === null || value >= 0, {
    message: "Nights cannot be negative.",
  })
  .refine((value) => value === null || value <= 365, {
    message: "Nights value is too high.",
  });

const createStayOptionSchema = z.object({
  tripId: z.string().trim().min(1, "Trip id is required."),
  tripDayId: z.string().trim().optional().nullable(),

  name: z
    .string()
    .trim()
    .min(2, "Stay name must be at least 2 characters.")
    .max(120, "Stay name must be less than 120 characters."),

  city: z
    .string()
    .trim()
    .max(100, "City must be less than 100 characters.")
    .optional()
    .nullable(),

  area: z
    .string()
    .trim()
    .max(120, "Area must be less than 120 characters.")
    .optional()
    .nullable(),

  stayType: stayTypeSchema.default("OTHER"),
  budgetLevel: budgetLevelSchema.default("MID_RANGE"),

  pricePerNight: decimalInputSchema,
  nights: intInputSchema,
  totalCost: decimalInputSchema,

  bestFor: z
    .string()
    .trim()
    .max(160, "Best for must be less than 160 characters.")
    .optional()
    .nullable(),

  notes: z
    .string()
    .trim()
    .max(250, "Notes must be less than 250 characters.")
    .optional()
    .nullable(),

  isSelected: z.boolean().optional(),
});

const updateStayOptionSchema = createStayOptionSchema.extend({
  stayOptionId: z.string().trim().min(1, "Stay option id is required."),
});

const deleteStayOptionSchema = z.object({
  tripId: z.string().trim().min(1, "Trip id is required."),
  stayOptionId: z.string().trim().min(1, "Stay option id is required."),
});

const selectStayOptionSchema = z.object({
  tripId: z.string().trim().min(1, "Trip id is required."),
  stayOptionId: z.string().trim().min(1, "Stay option id is required."),
  tripDayId: z.string().trim().optional().nullable(),
});

type CreateStayOptionInput = z.input<typeof createStayOptionSchema>;
type UpdateStayOptionInput = z.input<typeof updateStayOptionSchema>;
type DeleteStayOptionInput = z.infer<typeof deleteStayOptionSchema>;
type SelectStayOptionInput = z.infer<typeof selectStayOptionSchema>;
type UnselectStayOptionInput = DeleteStayOptionInput;

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

async function verifyTripDayBelongsToTrip(
  tripDayId: string | null | undefined,
  tripId: string
) {
  if (!tripDayId) return true;

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

export async function createStayOptionAction(input: CreateStayOptionInput) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be logged in to add a stay.",
      };
    }

    const parsedInput = createStayOptionSchema.safeParse(input);

    if (!parsedInput.success) {
      return {
        success: false,
        message:
          parsedInput.error.issues[0]?.message ?? "Invalid stay information.",
      };
    }

    const {
      tripId,
      tripDayId,
      name,
      city,
      area,
      stayType,
      budgetLevel,
      pricePerNight,
      nights,
      totalCost,
      bestFor,
      notes,
      isSelected,
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

    const stayOption = await prisma.stayOption.create({
      data: {
        tripId,
        tripDayId: tripDayId || null,
        name,
        city: cleanText(city),
        area: cleanText(area),
        stayType,
        budgetLevel,
        pricePerNight,
        nights,
        totalCost,
        isSelected: isSelected ?? true,
        bestFor: cleanText(bestFor),
        source: "USER_ADDED",
        notes: cleanText(notes),
      },
      select: {
        id: true,
        name: true,
        stayType: true,
        isSelected: true,
      },
    });

    await recalculateTripCost(tripId);
    revalidateTripPages(tripId);

    return {
      success: true,
      message: "Stay added successfully.",
      stayOption,
    };
  } catch (error) {
    console.error("CREATE_STAY_OPTION_ERROR", error);

    return {
      success: false,
      message: "Something went wrong while adding stay.",
    };
  }
}

export async function updateStayOptionAction(input: UpdateStayOptionInput) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be logged in to update this stay.",
      };
    }

    const parsedInput = updateStayOptionSchema.safeParse(input);

    if (!parsedInput.success) {
      return {
        success: false,
        message:
          parsedInput.error.issues[0]?.message ?? "Invalid stay information.",
      };
    }

    const {
      tripId,
      tripDayId,
      stayOptionId,
      name,
      city,
      area,
      stayType,
      budgetLevel,
      pricePerNight,
      nights,
      totalCost,
      bestFor,
      notes,
      isSelected,
    } = parsedInput.data;

    const stayOption = await prisma.stayOption.findFirst({
      where: {
        id: stayOptionId,
        tripId,
        trip: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!stayOption) {
      return {
        success: false,
        message: "Stay option not found.",
      };
    }

    const isValidTripDay = await verifyTripDayBelongsToTrip(tripDayId, tripId);

    if (!isValidTripDay) {
      return {
        success: false,
        message: "Selected day does not belong to this trip.",
      };
    }

    await prisma.stayOption.update({
      where: {
        id: stayOptionId,
      },
      data: {
        tripDayId: tripDayId || null,
        name,
        city: cleanText(city),
        area: cleanText(area),
        stayType,
        budgetLevel,
        pricePerNight,
        nights,
        totalCost,
        bestFor: cleanText(bestFor),
        notes: cleanText(notes),
        ...(typeof isSelected === "boolean" ? { isSelected } : {}),
      },
    });

    await recalculateTripCost(tripId);
    revalidateTripPages(tripId);

    return {
      success: true,
      message: "Stay updated successfully.",
    };
  } catch (error) {
    console.error("UPDATE_STAY_OPTION_ERROR", error);

    return {
      success: false,
      message: "Something went wrong while updating stay.",
    };
  }
}

export async function deleteStayOptionAction(input: DeleteStayOptionInput) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be logged in to delete this stay.",
      };
    }

    const parsedInput = deleteStayOptionSchema.safeParse(input);

    if (!parsedInput.success) {
      return {
        success: false,
        message:
          parsedInput.error.issues[0]?.message ?? "Invalid stay information.",
      };
    }

    const { tripId, stayOptionId } = parsedInput.data;

    const stayOption = await prisma.stayOption.findFirst({
      where: {
        id: stayOptionId,
        tripId,
        trip: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!stayOption) {
      return {
        success: false,
        message: "Stay option not found.",
      };
    }

    await prisma.stayOption.delete({
      where: {
        id: stayOptionId,
      },
    });

    await recalculateTripCost(tripId);
    revalidateTripPages(tripId);

    return {
      success: true,
      message: "Stay deleted successfully.",
    };
  } catch (error) {
    console.error("DELETE_STAY_OPTION_ERROR", error);

    return {
      success: false,
      message: "Something went wrong while deleting stay.",
    };
  }
}

export async function selectStayOptionAction(input: SelectStayOptionInput) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be logged in to select this stay.",
      };
    }

    const parsedInput = selectStayOptionSchema.safeParse(input);

    if (!parsedInput.success) {
      return {
        success: false,
        message:
          parsedInput.error.issues[0]?.message ?? "Invalid stay information.",
      };
    }

    const { tripId, stayOptionId, tripDayId } = parsedInput.data;

    const stayOption = await prisma.stayOption.findFirst({
      where: {
        id: stayOptionId,
        tripId,
        trip: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!stayOption) {
      return {
        success: false,
        message: "Stay option not found.",
      };
    }

    const isValidTripDay = await verifyTripDayBelongsToTrip(tripDayId, tripId);

    if (!isValidTripDay) {
      return {
        success: false,
        message: "Selected day does not belong to this trip.",
      };
    }

    await prisma.stayOption.update({
      where: {
        id: stayOptionId,
      },
      data: {
        isSelected: true,
        tripDayId: tripDayId || null,
      },
    });

    await recalculateTripCost(tripId);
    revalidateTripPages(tripId);

    return {
      success: true,
      message: "Stay added to final itinerary.",
    };
  } catch (error) {
    console.error("SELECT_STAY_OPTION_ERROR", error);

    return {
      success: false,
      message: "Something went wrong while selecting stay.",
    };
  }
}

export async function unselectStayOptionAction(
  input: UnselectStayOptionInput
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be logged in to move this stay to options.",
      };
    }

    const parsedInput = deleteStayOptionSchema.safeParse(input);

    if (!parsedInput.success) {
      return {
        success: false,
        message:
          parsedInput.error.issues[0]?.message ?? "Invalid stay information.",
      };
    }

    const { tripId, stayOptionId } = parsedInput.data;

    const stayOption = await prisma.stayOption.findFirst({
      where: {
        id: stayOptionId,
        tripId,
        trip: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!stayOption) {
      return {
        success: false,
        message: "Stay option not found.",
      };
    }

    await prisma.stayOption.update({
      where: {
        id: stayOptionId,
      },
      data: {
        isSelected: false,
      },
    });

    await recalculateTripCost(tripId);
    revalidateTripPages(tripId);

    return {
      success: true,
      message: "Stay moved to options.",
    };
  } catch (error) {
    console.error("UNSELECT_STAY_OPTION_ERROR", error);

    return {
      success: false,
      message: "Something went wrong while moving stay to options.",
    };
  }
}
