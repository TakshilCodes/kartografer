"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { TripStatus } from "@prisma/client";

import { generateTripSmartly } from "@/lib/ai/generate-trip-smartly";
import { getAiGenerationErrorDetails } from "@/lib/ai/ai-error-details";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  consumeAiTripGenerationLimit,
  getAiRateLimitErrorMessage,
} from "@/lib/rate-limit/ai-rate-limit";
import { createBaseTrip } from "@/lib/trips/create-base-trip";
import { recalculateTripCost } from "@/lib/trips/recalculate-trip-cost";
import { saveGeneratedTrip } from "@/lib/trips/save-generated-trip";
import { createTripSchema } from "@/lib/validations/trip.validation";

type CreateTripActionResult =
  | {
      ok: true;
      tripId: string;
      error: null;
      errorKind?: null;
    }
  | {
      ok: false;
      tripId: string | null;
      error: string;
      errorKind?:
        | "AUTH"
        | "VALIDATION"
        | "AI_RATE_LIMIT"
        | "AI_BUSY"
        | "AI_FAILED"
        | "UNKNOWN";
    };

function revalidateTripShell(tripId: string) {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/new");
  revalidatePath("/dashboard/trips");
  revalidatePath("/dashboard/trips/" + tripId);
}

export async function createTripAction(
  input: unknown
): Promise<CreateTripActionResult> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        ok: false,
        tripId: null,
        error: "You must be logged in to create a trip.",
        errorKind: "AUTH",
      };
    }

    const parsed = createTripSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        tripId: null,
        error: parsed.error.issues[0]?.message ?? "Invalid trip details.",
        errorKind: "VALIDATION",
      };
    }

    const data = parsed.data;
    const aiRateLimit = await consumeAiTripGenerationLimit({
      userId: session.user.id,
      isLongTrip: data.days > 7,
    });

    if (!aiRateLimit.allowed) {
      return {
        ok: false,
        tripId: null,
        error: getAiRateLimitErrorMessage(aiRateLimit),
        errorKind: "AI_RATE_LIMIT",
      };
    }

    const result = await createBaseTrip({
      userId: session.user.id,
      data,
      status: TripStatus.DRAFT,
    });

    try {
      const generatedTrip = await generateTripSmartly({
        fromPlace: result.fromPlace?.formattedName ?? result.fromName,
        toPlace: result.toPlace?.formattedName ?? result.destinationName,
        daysCount: data.days,
        peopleCount: data.people,
        budgetAmount: data.budget ?? null,
        currency: "INR",
        tripType: result.tripType,
        travelPace: result.travelPace,
        foodPreference: result.foodPreference,
        transportPreference: result.transportPreference,
        specialNotes: data.notes || null,
      });

      await saveGeneratedTrip({
        tripId: result.id,
        generatedTrip,
      });

      await recalculateTripCost(result.id);
      revalidateTripShell(result.id);

      return {
        ok: true,
        tripId: result.id,
        error: null,
        errorKind: null,
      };
    } catch (aiError) {
      console.error("AI_TRIP_GENERATION_ERROR", aiError);
      const aiErrorDetails = getAiGenerationErrorDetails(aiError);

      await prisma.trip.update({
        where: { id: result.id },
        data: {
          status: TripStatus.DRAFT,
          isAiGenerated: false,
          summary:
            "AI generation failed. This trip was created as an empty draft.",
        },
      });

      revalidateTripShell(result.id);

      return {
        ok: false,
        tripId: result.id,
        error: aiErrorDetails.error,
        errorKind: aiErrorDetails.errorKind,
      };
    }
  } catch (error) {
    console.error("CREATE_TRIP_ACTION_ERROR", error);

    return {
      ok: false,
      tripId: null,
      error: "Something went wrong while creating your trip.",
      errorKind: "UNKNOWN",
    };
  }
}