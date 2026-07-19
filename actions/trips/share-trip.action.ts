"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { getPublicTripShareUrl } from "@/lib/app-url";
import prisma from "@/lib/prisma";
import { createUniquePublicShareSlug } from "@/lib/trips/public-share-slug";

const tripIdSchema = z.string().trim().min(1, "Trip id is required.");

function revalidateSharePages(tripId: string, slug?: string | null) {
  revalidatePath(`/dashboard/trips/${tripId}`);

  if (slug) {
    revalidatePath(`/share/trips/${slug}`);
  }
}

export async function enableTripPublicShareAction(tripId: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        ok: false as const,
        error: "You must be logged in to share this trip.",
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
      select: {
        id: true,
        publicShareSlug: true,
      },
    });

    if (!trip) {
      return {
        ok: false as const,
        error: "Trip not found.",
      };
    }

    const publicShareSlug =
      trip.publicShareSlug ?? (await createUniquePublicShareSlug());

    await prisma.trip.update({
      where: {
        id: trip.id,
      },
      data: {
        isPublicShareEnabled: true,
        publicShareSlug,
        publicSharedAt: new Date(),
      },
    });

    revalidateSharePages(trip.id, publicShareSlug);

    return {
      ok: true as const,
      publicUrl: getPublicTripShareUrl(publicShareSlug),
      error: null,
    };
  } catch (error) {
    console.error("ENABLE_TRIP_PUBLIC_SHARE_ERROR", error);

    return {
      ok: false as const,
      error: "Something went wrong while enabling public sharing.",
    };
  }
}

export async function disableTripPublicShareAction(tripId: string) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        ok: false as const,
        error: "You must be logged in to manage this trip's sharing.",
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
      select: {
        id: true,
        publicShareSlug: true,
      },
    });

    if (!trip) {
      return {
        ok: false as const,
        error: "Trip not found.",
      };
    }

    await prisma.trip.update({
      where: {
        id: trip.id,
      },
      data: {
        isPublicShareEnabled: false,
      },
    });

    revalidateSharePages(trip.id, trip.publicShareSlug);

    return {
      ok: true as const,
      error: null,
    };
  } catch (error) {
    console.error("DISABLE_TRIP_PUBLIC_SHARE_ERROR", error);

    return {
      ok: false as const,
      error: "Something went wrong while disabling public sharing.",
    };
  }
}
