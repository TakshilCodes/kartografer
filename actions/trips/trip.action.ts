"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const tripIdSchema = z.object({
  tripId: z.string().trim().min(1, "Trip id is required."),
});

const renameTripSchema = tripIdSchema.extend({
  title: z
    .string()
    .trim()
    .min(3, "Trip title must be at least 3 characters.")
    .max(100, "Trip title must be less than 100 characters."),
});

type DeleteTripInput = z.infer<typeof tripIdSchema>;
type RenameTripInput = z.infer<typeof renameTripSchema>;

function revalidateTripShell(tripId?: string) {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/new");
  revalidatePath("/dashboard/trips");

  if (tripId) {
    revalidatePath(`/dashboard/trips/${tripId}`);
    revalidatePath(`/dashboard/trips/${tripId}/edit`);
  }
}

async function getOwnedTrip(tripId: string, userId: string) {
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

export async function renameTripAction(input: RenameTripInput) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be logged in to rename this trip.",
      };
    }

    const parsedInput = renameTripSchema.safeParse(input);

    if (!parsedInput.success) {
      return {
        success: false,
        message:
          parsedInput.error.issues[0]?.message ?? "Invalid trip information.",
      };
    }

    const { tripId, title } = parsedInput.data;
    const trip = await getOwnedTrip(tripId, session.user.id);

    if (!trip) {
      return {
        success: false,
        message: "Trip not found.",
      };
    }

    await prisma.trip.update({
      where: {
        id: tripId,
      },
      data: {
        title,
      },
    });

    revalidateTripShell(tripId);

    return {
      success: true,
      message: "Trip renamed successfully.",
    };
  } catch (error) {
    console.error("RENAME_TRIP_ERROR", error);

    return {
      success: false,
      message: "Something went wrong while renaming this trip.",
    };
  }
}

export async function deleteTripAction(input: DeleteTripInput) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be logged in to delete this trip.",
      };
    }

    const parsedInput = tripIdSchema.safeParse(input);

    if (!parsedInput.success) {
      return {
        success: false,
        message:
          parsedInput.error.issues[0]?.message ?? "Invalid trip information.",
      };
    }

    const { tripId } = parsedInput.data;
    const trip = await getOwnedTrip(tripId, session.user.id);

    if (!trip) {
      return {
        success: false,
        message: "Trip not found.",
      };
    }

    await prisma.trip.delete({
      where: {
        id: tripId,
      },
    });

    revalidateTripShell(tripId);

    return {
      success: true,
      message: "Trip deleted successfully.",
    };
  } catch (error) {
    console.error("DELETE_TRIP_ERROR", error);

    return {
      success: false,
      message: "Something went wrong while deleting this trip.",
    };
  }
}
