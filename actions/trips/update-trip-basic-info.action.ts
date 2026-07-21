"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const updateTripBasicInfoSchema = z.object({
  tripId: z.string().trim().min(1, "Trip id is required."),
  title: z
    .string()
    .trim()
    .min(3, "Trip title must be at least 3 characters.")
    .max(100, "Trip title must be less than 100 characters."),
  summary: z
    .string()
    .trim()
    .max(500, "Trip summary must be less than 500 characters.")
    .optional()
    .nullable(),
});

type UpdateTripBasicInfoInput = z.infer<typeof updateTripBasicInfoSchema>;

export async function updateTripBasicInfoAction(
  input: UpdateTripBasicInfoInput,
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        message: "You must be logged in to update this trip.",
      };
    }

    const parsedInput = updateTripBasicInfoSchema.safeParse(input);

    if (!parsedInput.success) {
      return {
        success: false,
        message:
          parsedInput.error.issues[0]?.message ?? "Invalid trip information.",
      };
    }

    const { tripId, title, summary } = parsedInput.data;

    const existingTrip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!existingTrip) {
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
        summary: summary?.trim() ? summary.trim() : null,
      },
    });

    revalidatePath(`/dashboard/trips/${tripId}`);
    revalidatePath(`/dashboard/trips/${tripId}/edit`);
    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/new");
    revalidatePath("/dashboard/trips");

    return {
      success: true,
      message: "Trip information updated successfully.",
    };
  } catch (error) {
    console.error("UPDATE_TRIP_BASIC_INFO_ERROR", error);

    return {
      success: false,
      message: "Something went wrong while updating trip information.",
    };
  }
}
