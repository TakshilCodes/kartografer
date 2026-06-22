"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { TripStatus } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import {
  consumeManualTripCreationLimit,
  getManualTripCreationRateLimitMessage,
} from "@/lib/rate-limit/trip-creation-rate-limit";
import { createBaseTrip } from "@/lib/trips/create-base-trip";
import { createTripSchema } from "@/lib/validations/trip.validation";

type CreateManualTripResult =
  | {
      ok: true;
      tripId: string;
      error: null;
    }
  | {
      ok: false;
      tripId: null;
      error: string;
    };

function revalidateTripPages(tripId: string) {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/new");
  revalidatePath("/dashboard/trips");
  revalidatePath("/dashboard/trips/" + tripId);
  revalidatePath("/dashboard/trips/" + tripId + "/edit");
}

export async function createManualTripAction(
  input: unknown
): Promise<CreateManualTripResult> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        ok: false,
        tripId: null,
        error: "You must be logged in to create a trip.",
      };
    }

    const parsed = createTripSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        tripId: null,
        error: parsed.error.issues[0]?.message ?? "Invalid trip details.",
      };
    }

    const rateLimit = await consumeManualTripCreationLimit({
      userId: session.user.id,
    });

    if (!rateLimit.allowed) {
      return {
        ok: false,
        tripId: null,
        error: getManualTripCreationRateLimitMessage(rateLimit),
      };
    }

    const trip = await createBaseTrip({
      userId: session.user.id,
      data: parsed.data,
      status: TripStatus.EDITING,
    });

    revalidateTripPages(trip.id);

    return {
      ok: true,
      tripId: trip.id,
      error: null,
    };
  } catch (error) {
    console.error("CREATE_MANUAL_TRIP_ERROR", error);

    return {
      ok: false,
      tripId: null,
      error: "Something went wrong while creating your manual trip.",
    };
  }
}