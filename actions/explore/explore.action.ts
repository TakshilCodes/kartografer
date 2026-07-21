"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  createPublicTripSnapshot,
  getPublicSnapshotContentUpdatedAt,
  getTripForPublicSnapshot,
} from "@/lib/explore/public-trip-snapshot";

const tagSchema = z
  .string()
  .trim()
  .min(1, "Tag cannot be empty.")
  .max(34, "Each tag must be less than 35 characters.")
  .regex(/^\S+$/, "Tags cannot contain spaces. Use hyphens instead.")
  .transform((tag) => tag.toLowerCase());

const publishSchema = z.object({
  tripId: z.string().trim().min(1, "Trip id is required."),
  publicTitle: z.string().trim().min(2, "Public title is required.").max(120),
  publicDescription: z.string().trim().max(500).optional(),
  destination: z.string().trim().min(2, "Destination is required.").max(80),
  coverImageUrl: z
    .string()
    .trim()
    .url()
    .nullable()
    .optional()
    .or(z.literal("")),
  budgetStyle: z.enum(["budget", "mid-range", "luxury", ""]).default(""),
  travelStyle: z
    .enum(["solo", "couple", "family", "friends", "adventure", "relaxing", ""])
    .default(""),
  tags: z.array(tagSchema).max(15, "You can add up to 15 tags.").default([]),
});

const tripIdSchema = z.string().trim().min(1, "Trip id is required.");

function normalizeTags(tags: string[]) {
  return Array.from(
    new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean)),
  ).slice(0, 15);
}

function revalidateTripExplorePaths(tripId: string) {
  revalidatePath("/explore");
  revalidatePath(`/explore/${tripId}`);
  revalidatePath(`/dashboard/trips/${tripId}`);
}

export async function publishTripToExploreAction(
  input: z.input<typeof publishSchema>,
) {
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

    const trip = await getTripForPublicSnapshot({
      tripId: parsed.data.tripId,
      userId: session.user.id,
    });

    if (!trip) {
      return {
        ok: false as const,
        error: "Trip not found.",
      };
    }

    const publishedAt = new Date();
    const publicFields = {
      publicTitle: parsed.data.publicTitle,
      publicDescription: parsed.data.publicDescription || null,
      destination: parsed.data.destination,
      coverImageUrl: parsed.data.coverImageUrl || null,
      budgetStyle: parsed.data.budgetStyle || null,
      travelStyle: parsed.data.travelStyle || null,
      tags: normalizeTags(parsed.data.tags),
      publishedAt,
    };
    const snapshot = createPublicTripSnapshot({ trip, publicFields });
    const sourceContentUpdatedAt = getPublicSnapshotContentUpdatedAt(trip);

    await prisma.trip.update({
      where: { id: trip.id },
      data: {
        isPublic: true,
        publicTitle: publicFields.publicTitle,
        publicDescription: publicFields.publicDescription,
        destination: publicFields.destination,
        coverImageUrl: publicFields.coverImageUrl,
        durationDays: trip.daysCount,
        budgetStyle: publicFields.budgetStyle,
        travelStyle: publicFields.travelStyle,
        tags: publicFields.tags,
        publishedAt,
        publicSnapshotJson: snapshot,
        publicSnapshotUpdatedAt: publishedAt,
        publicSnapshotContentUpdatedAt: sourceContentUpdatedAt,
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
        publicSnapshotJson: Prisma.JsonNull,
        publicSnapshotUpdatedAt: null,
        publicSnapshotContentUpdatedAt: null,
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
