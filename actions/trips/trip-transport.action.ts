"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { recalculateTripCost } from "@/lib/trips/recalculate-trip-cost";

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

const createTransportOptionSchema = z.object({
  tripId: z.string().trim().min(1, "Trip id is required."),
  tripDayId: z.string().trim().optional().nullable(),

  title: z
    .string()
    .trim()
    .min(2, "Transport title must be at least 2 characters.")
    .max(120, "Transport title must be less than 120 characters."),

  mode: transportModeSchema.default("OTHER"),

  fromText: z
    .string()
    .trim()
    .max(120, "From location must be less than 120 characters.")
    .optional()
    .nullable(),

  toText: z
    .string()
    .trim()
    .max(120, "To location must be less than 120 characters.")
    .optional()
    .nullable(),

  description: z
    .string()
    .trim()
    .max(700, "Description must be less than 700 characters.")
    .optional()
    .nullable(),

  costType: costTypeSchema.default("TOTAL"),
  pricePerPerson: decimalInputSchema,
  totalCost: decimalInputSchema,

  notes: z
    .string()
    .trim()
    .max(1000, "Notes must be less than 1000 characters.")
    .optional()
    .nullable(),

  isSelected: z.boolean().optional(),
});

const updateTransportOptionSchema = createTransportOptionSchema.extend({
  transportOptionId: z
    .string()
    .trim()
    .min(1, "Transport option id is required."),
});

const deleteTransportOptionSchema = z.object({
  tripId: z.string().trim().min(1, "Trip id is required."),
  transportOptionId: z
    .string()
    .trim()
    .min(1, "Transport option id is required."),
});

const selectTransportOptionSchema = z.object({
  tripId: z.string().trim().min(1, "Trip id is required."),
  transportOptionId: z
    .string()
    .trim()
    .min(1, "Transport option id is required."),
  tripDayId: z.string().trim().optional().nullable(),
});

type CreateTransportOptionInput = z.input<
  typeof createTransportOptionSchema
>;

type UpdateTransportOptionInput = z.input<
  typeof updateTransportOptionSchema
>;

type DeleteTransportOptionInput = z.infer<
  typeof deleteTransportOptionSchema
>;

type SelectTransportOptionInput = z.infer<
  typeof selectTransportOptionSchema
>;

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

export async function createTransportOptionAction(
  input: CreateTransportOptionInput
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be logged in to add transport.",
      };
    }

    const parsedInput = createTransportOptionSchema.safeParse(input);

    if (!parsedInput.success) {
      return {
        success: false,
        message:
          parsedInput.error.issues[0]?.message ??
          "Invalid transport information.",
      };
    }

    const {
      tripId,
      tripDayId,
      title,
      mode,
      fromText,
      toText,
      description,
      costType,
      pricePerPerson,
      totalCost,
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

    const transportOption = await prisma.transportOption.create({
      data: {
        tripId,
        tripDayId: tripDayId || null,
        title,
        mode,
        fromText: cleanText(fromText),
        toText: cleanText(toText),
        description: cleanText(description),
        costType,
        pricePerPerson,
        totalCost,
        isSelected: isSelected ?? true,
        source: "USER_ADDED",
        notes: cleanText(notes),
      },
      select: {
        id: true,
        title: true,
        mode: true,
        isSelected: true,
      },
    });

    await recalculateTripCost(tripId);
    revalidateTripPages(tripId);

    return {
      success: true,
      message: "Transport added successfully.",
      transportOption,
    };
  } catch (error) {
    console.error("CREATE_TRANSPORT_OPTION_ERROR", error);

    return {
      success: false,
      message: "Something went wrong while adding transport.",
    };
  }
}

export async function updateTransportOptionAction(
  input: UpdateTransportOptionInput
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be logged in to update transport.",
      };
    }

    const parsedInput = updateTransportOptionSchema.safeParse(input);

    if (!parsedInput.success) {
      return {
        success: false,
        message:
          parsedInput.error.issues[0]?.message ??
          "Invalid transport information.",
      };
    }

    const {
      tripId,
      tripDayId,
      transportOptionId,
      title,
      mode,
      fromText,
      toText,
      description,
      costType,
      pricePerPerson,
      totalCost,
      notes,
      isSelected,
    } = parsedInput.data;

    const transportOption = await prisma.transportOption.findFirst({
      where: {
        id: transportOptionId,
        tripId,
        trip: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!transportOption) {
      return {
        success: false,
        message: "Transport option not found.",
      };
    }

    const isValidTripDay = await verifyTripDayBelongsToTrip(tripDayId, tripId);

    if (!isValidTripDay) {
      return {
        success: false,
        message: "Selected day does not belong to this trip.",
      };
    }

    await prisma.transportOption.update({
      where: {
        id: transportOptionId,
      },
      data: {
        tripDayId: tripDayId || null,
        title,
        mode,
        fromText: cleanText(fromText),
        toText: cleanText(toText),
        description: cleanText(description),
        costType,
        pricePerPerson,
        totalCost,
        notes: cleanText(notes),
        ...(typeof isSelected === "boolean" ? { isSelected } : {}),
      },
    });

    await recalculateTripCost(tripId);
    revalidateTripPages(tripId);

    return {
      success: true,
      message: "Transport updated successfully.",
    };
  } catch (error) {
    console.error("UPDATE_TRANSPORT_OPTION_ERROR", error);

    return {
      success: false,
      message: "Something went wrong while updating transport.",
    };
  }
}

export async function deleteTransportOptionAction(
  input: DeleteTransportOptionInput
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be logged in to delete transport.",
      };
    }

    const parsedInput = deleteTransportOptionSchema.safeParse(input);

    if (!parsedInput.success) {
      return {
        success: false,
        message:
          parsedInput.error.issues[0]?.message ??
          "Invalid transport information.",
      };
    }

    const { tripId, transportOptionId } = parsedInput.data;

    const transportOption = await prisma.transportOption.findFirst({
      where: {
        id: transportOptionId,
        tripId,
        trip: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!transportOption) {
      return {
        success: false,
        message: "Transport option not found.",
      };
    }

    await prisma.transportOption.delete({
      where: {
        id: transportOptionId,
      },
    });

    await recalculateTripCost(tripId);
    revalidateTripPages(tripId);

    return {
      success: true,
      message: "Transport deleted successfully.",
    };
  } catch (error) {
    console.error("DELETE_TRANSPORT_OPTION_ERROR", error);

    return {
      success: false,
      message: "Something went wrong while deleting transport.",
    };
  }
}

export async function selectTransportOptionAction(
  input: SelectTransportOptionInput
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be logged in to select transport.",
      };
    }

    const parsedInput = selectTransportOptionSchema.safeParse(input);

    if (!parsedInput.success) {
      return {
        success: false,
        message:
          parsedInput.error.issues[0]?.message ??
          "Invalid transport information.",
      };
    }

    const { tripId, transportOptionId, tripDayId } = parsedInput.data;

    const transportOption = await prisma.transportOption.findFirst({
      where: {
        id: transportOptionId,
        tripId,
        trip: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!transportOption) {
      return {
        success: false,
        message: "Transport option not found.",
      };
    }

    const isValidTripDay = await verifyTripDayBelongsToTrip(tripDayId, tripId);

    if (!isValidTripDay) {
      return {
        success: false,
        message: "Selected day does not belong to this trip.",
      };
    }

    await prisma.transportOption.update({
      where: {
        id: transportOptionId,
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
      message: "Transport added to final itinerary.",
    };
  } catch (error) {
    console.error("SELECT_TRANSPORT_OPTION_ERROR", error);

    return {
      success: false,
      message: "Something went wrong while selecting transport.",
    };
  }
}
