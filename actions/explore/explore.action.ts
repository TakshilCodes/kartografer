"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const publishSchema = z.object({
  tripId: z.string().trim().min(1, "Trip id is required."),
  publicTitle: z.string().trim().min(2, "Public title is required.").max(120),
  publicDescription: z.string().trim().max(500).optional(),
  destination: z.string().trim().max(80).optional(),
  coverImageUrl: z.string().trim().url().optional().or(z.literal("")),
  budgetStyle: z.enum(["budget", "mid-range", "luxury", ""]).default(""),
  travelStyle: z
    .enum(["solo", "couple", "family", "friends", "adventure", "relaxing", ""])
    .default(""),
  tags: z.string().trim().max(180).optional(),
});

const tripIdSchema = z.string().trim().min(1, "Trip id is required.");

function normalizeTags(value?: string) {
  if (!value) return [];

  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 8)
    )
  );
}

function revalidateTripExplorePaths(tripId: string) {
  revalidatePath("/explore");
  revalidatePath(`/explore/${tripId}`);
  revalidatePath(`/dashboard/trips/${tripId}`);
}

export async function publishTripToExploreAction(input: z.input<typeof publishSchema>) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        ok: false as const,
        error: "You must be logged in to publish this trip.",
      };
    }

    const parsed = publishSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false as const,
        error: parsed.error.issues[0]?.message ?? "Invalid publish details.",
      };
    }

    const trip = await prisma.trip.findFirst({
      where: {
        id: parsed.data.tripId,
        userId: session.user.id,
      },
      select: {
        id: true,
        daysCount: true,
        toPlace: { select: { name: true } },
      },
    });

    if (!trip) {
      return {
        ok: false as const,
        error: "Trip not found.",
      };
    }

    await prisma.trip.update({
      where: { id: trip.id },
      data: {
        isPublic: true,
        publicTitle: parsed.data.publicTitle,
        publicDescription: parsed.data.publicDescription || null,
        destination: parsed.data.destination || trip.toPlace?.name || null,
        coverImageUrl: parsed.data.coverImageUrl || null,
        durationDays: trip.daysCount,
        budgetStyle: parsed.data.budgetStyle || null,
        travelStyle: parsed.data.travelStyle || null,
        tags: normalizeTags(parsed.data.tags),
        publishedAt: new Date(),
      },
    });

    revalidateTripExplorePaths(trip.id);

    return {
      ok: true as const,
      error: null,
    };
  } catch (error) {
    console.error("PUBLISH_TRIP_TO_EXPLORE_ERROR", error);

    return {
      ok: false as const,
      error: "Something went wrong while publishing this trip.",
    };
  }
}

export async function unpublishTripFromExploreAction(tripId: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        ok: false as const,
        error: "You must be logged in to unpublish this trip.",
      };
    }

    const parsedTripId = tripIdSchema.safeParse(tripId);

    if (!parsedTripId.success) {
      return {
        ok: false as const,
        error: parsedTripId.error.issues[0]?.message ?? "Invalid trip id.",
      };
    }

    const trip = await prisma.trip.findFirst({
      where: {
        id: parsedTripId.data,
        userId: session.user.id,
      },
      select: { id: true },
    });

    if (!trip) {
      return {
        ok: false as const,
        error: "Trip not found.",
      };
    }

    await prisma.trip.update({
      where: { id: trip.id },
      data: {
        isPublic: false,
        publishedAt: null,
      },
    });

    revalidateTripExplorePaths(trip.id);

    return {
      ok: true as const,
      error: null,
    };
  } catch (error) {
    console.error("UNPUBLISH_TRIP_FROM_EXPLORE_ERROR", error);

    return {
      ok: false as const,
      error: "Something went wrong while unpublishing this trip.",
    };
  }
}