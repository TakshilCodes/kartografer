"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const createTripDaySchema = z.object({
  tripId: z.string().trim().min(1, "Trip id is required."),
});

const updateTripDayInfoSchema = z.object({
  tripId: z.string().trim().min(1, "Trip id is required."),
  tripDayId: z.string().trim().min(1, "Trip day id is required."),

  title: z
    .string()
    .trim()
    .min(3, "Day title must be at least 3 characters.")
    .max(100, "Day title must be less than 100 characters."),

  description: z
    .string()
    .trim()
    .max(700, "Day description must be less than 700 characters.")
    .optional()
    .nullable(),

  notes: z
    .string()
    .trim()
    .max(1000, "Day notes must be less than 1000 characters.")
    .optional()
    .nullable(),

  estimatedCost: z
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
      message: "Estimated cost must be a valid number.",
    })
    .refine((value) => value === null || value >= 0, {
      message: "Estimated cost cannot be negative.",
    })
    .refine((value) => value === null || value <= 10_000_000, {
      message: "Estimated cost is too high.",
    }),
});

const deleteTripDaySchema = z.object({
  tripId: z.string().trim().min(1, "Trip id is required."),
  tripDayId: z.string().trim().min(1, "Trip day id is required."),
});

type CreateTripDayInput = z.infer<typeof createTripDaySchema>;
type UpdateTripDayInfoInput = z.input<typeof updateTripDayInfoSchema>;
type DeleteTripDayInput = z.infer<typeof deleteTripDaySchema>;

function revalidateTripPages(tripId: string) {
  revalidatePath(`/dashboard/trips/${tripId}`);
  revalidatePath(`/dashboard/trips/${tripId}/edit`);
  revalidatePath("/dashboard/new");
}

export async function createTripDayAction(input: CreateTripDayInput) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be logged in to add a day.",
      };
    }

    const parsedInput = createTripDaySchema.safeParse(input);

    if (!parsedInput.success) {
      return {
        success: false,
        message:
          parsedInput.error.issues[0]?.message ?? "Invalid trip information.",
      };
    }

    const { tripId } = parsedInput.data;

    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        userId: session.user.id,
      },
      select: {
        id: true,
        daysCount: true,
        days: {
          select: {
            dayNumber: true,
          },
          orderBy: {
            dayNumber: "desc",
          },
          take: 1,
        },
      },
    });

    if (!trip) {
      return {
        success: false,
        message: "Trip not found.",
      };
    }

    const highestDayNumber = trip.days[0]?.dayNumber ?? 0;
    const newDayNumber = highestDayNumber + 1;

    const newDay = await prisma.tripDay.create({
      data: {
        tripId,
        dayNumber: newDayNumber,
        title: `Day ${newDayNumber}`,
        description: null,
        notes: null,
        estimatedCost: null,
      },
      select: {
        id: true,
        dayNumber: true,
      },
    });

    await prisma.trip.update({
      where: {
        id: tripId,
      },
      data: {
        daysCount: newDayNumber,
      },
    });

    revalidateTripPages(tripId);

    return {
      success: true,
      message: "Day added successfully.",
      day: newDay,
    };
  } catch (error) {
    console.error("CREATE_TRIP_DAY_ERROR", error);

    return {
      success: false,
      message: "Something went wrong while adding the day.",
    };
  }
}

export async function updateTripDayInfoAction(
  input: UpdateTripDayInfoInput
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be logged in to update this day.",
      };
    }

    const parsedInput = updateTripDayInfoSchema.safeParse(input);

    if (!parsedInput.success) {
      return {
        success: false,
        message:
          parsedInput.error.issues[0]?.message ?? "Invalid day information.",
      };
    }

    const { tripId, tripDayId, title, description, notes, estimatedCost } =
      parsedInput.data;

    const tripDay = await prisma.tripDay.findFirst({
      where: {
        id: tripDayId,
        tripId,
        trip: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!tripDay) {
      return {
        success: false,
        message: "Trip day not found.",
      };
    }

    await prisma.tripDay.update({
      where: {
        id: tripDayId,
      },
      data: {
        title,
        description: description?.trim() ? description.trim() : null,
        notes: notes?.trim() ? notes.trim() : null,
        estimatedCost,
      },
    });

    revalidateTripPages(tripId);

    return {
      success: true,
      message: "Day information updated successfully.",
    };
  } catch (error) {
    console.error("UPDATE_TRIP_DAY_INFO_ERROR", error);

    return {
      success: false,
      message: "Something went wrong while updating day information.",
    };
  }
}

export async function deleteTripDayAction(input: DeleteTripDayInput) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be logged in to delete this day.",
      };
    }

    const parsedInput = deleteTripDaySchema.safeParse(input);

    if (!parsedInput.success) {
      return {
        success: false,
        message:
          parsedInput.error.issues[0]?.message ?? "Invalid day information.",
      };
    }

    const { tripId, tripDayId } = parsedInput.data;

    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        userId: session.user.id,
      },
      select: {
        id: true,
        days: {
          select: {
            id: true,
            dayNumber: true,
          },
          orderBy: {
            dayNumber: "asc",
          },
        },
      },
    });

    if (!trip) {
      return {
        success: false,
        message: "Trip not found.",
      };
    }

    const dayToDelete = trip.days.find((day) => day.id === tripDayId);

    if (!dayToDelete) {
      return {
        success: false,
        message: "Trip day not found.",
      };
    }

    if (trip.days.length <= 1) {
      return {
        success: false,
        message: "A trip must have at least one day.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.tripDay.delete({
        where: {
          id: tripDayId,
        },
      });

      const remainingDays = await tx.tripDay.findMany({
        where: {
          tripId,
        },
        select: {
          id: true,
          dayNumber: true,
        },
        orderBy: {
          dayNumber: "asc",
        },
      });

      for (const [index, day] of remainingDays.entries()) {
        const nextDayNumber = index + 1;

        if (day.dayNumber !== nextDayNumber) {
          await tx.tripDay.update({
            where: {
              id: day.id,
            },
            data: {
              dayNumber: nextDayNumber,
              title:
                day.dayNumber === dayToDelete.dayNumber
                  ? `Day ${nextDayNumber}`
                  : undefined,
            },
          });
        }
      }

      await tx.trip.update({
        where: {
          id: tripId,
        },
        data: {
          daysCount: remainingDays.length,
        },
      });
    });

    revalidateTripPages(tripId);

    return {
      success: true,
      message: "Day deleted successfully.",
    };
  } catch (error) {
    console.error("DELETE_TRIP_DAY_ERROR", error);

    return {
      success: false,
      message: "Something went wrong while deleting the day.",
    };
  }
}