"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { generateTripWithAi } from "@/lib/ai/ai-client";
import { getRetryAiErrorMessage } from "@/lib/ai/ai-error-details";
import prisma from "@/lib/prisma";
import { recalculateTripCost } from "@/lib/trips/recalculate-trip-cost";
import { saveGeneratedTrip } from "@/lib/trips/save-generated-trip";

const generateTripItinerarySchema = z.object({
  tripId: z.string().trim().min(1, "Trip id is required."),
});

type GenerateTripItineraryInput = z.infer<
  typeof generateTripItinerarySchema
>;

type GenerateTripItineraryResult =
  | {
      ok: true;
      tripId: string;
      error: null;
    }
  | {
      ok: false;
      tripId: string | null;
      error: string;
    };

function revalidateTripPages(tripId: string) {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/dashboard/trips");
  revalidatePath(`/dashboard/trips/${tripId}`);
  revalidatePath(`/dashboard/trips/${tripId}/edit`);
}

function getNumberValue(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const numberValue = Number(value);

  return Number.isNaN(numberValue) ? null : numberValue;
}

function hasAnyItineraryItems(count: {
  transportOptions: number;
  stayOptions: number;
  mealSuggestions: number;
  activities: number;
}) {
  return (
    count.transportOptions > 0 ||
    count.stayOptions > 0 ||
    count.mealSuggestions > 0 ||
    count.activities > 0
  );
}

export async function generateTripItineraryAction(
  input: GenerateTripItineraryInput
): Promise<GenerateTripItineraryResult> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        ok: false,
        tripId: null,
        error: "You must be logged in to generate this trip itinerary.",
      };
    }

    const parsedInput = generateTripItinerarySchema.safeParse(input);

    if (!parsedInput.success) {
      return {
        ok: false,
        tripId: null,
        error:
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
        fromPlace: {
          select: {
            formattedName: true,
            name: true,
          },
        },
        toPlace: {
          select: {
            formattedName: true,
            name: true,
          },
        },
        daysCount: true,
        peopleCount: true,
        budgetAmount: true,
        currency: true,
        tripType: true,
        travelPace: true,
        foodPreference: true,
        transportPreference: true,
        specialNotes: true,
        _count: {
          select: {
            transportOptions: true,
            stayOptions: true,
            mealSuggestions: true,
            activities: true,
          },
        },
      },
    });

    if (!trip) {
      return {
        ok: false,
        tripId,
        error: "Trip not found.",
      };
    }

    if (!trip.fromPlace || !trip.toPlace) {
      return {
        ok: false,
        tripId,
        error: "This trip is missing start or destination details.",
      };
    }

    if (hasAnyItineraryItems(trip._count)) {
      return {
        ok: false,
        tripId,
        error:
          "This trip already has itinerary items. Continue editing manually from the trip editor.",
      };
    }

    try {
      const generatedTrip = await generateTripWithAi({
        fromPlace: trip.fromPlace.formattedName ?? trip.fromPlace.name,
        toPlace: trip.toPlace.formattedName ?? trip.toPlace.name,
        daysCount: trip.daysCount,
        peopleCount: trip.peopleCount,
        budgetAmount: getNumberValue(trip.budgetAmount),
        currency: trip.currency,
        tripType: trip.tripType,
        travelPace: trip.travelPace,
        foodPreference: trip.foodPreference,
        transportPreference: trip.transportPreference,
        specialNotes: trip.specialNotes,
      });

      await saveGeneratedTrip({
        tripId,
        generatedTrip,
      });

      await recalculateTripCost(tripId);
      revalidateTripPages(tripId);

      return {
        ok: true,
        tripId,
        error: null,
      };
    } catch (aiError) {
      console.error("RETRY_AI_TRIP_GENERATION_ERROR", aiError);

      await prisma.trip.update({
        where: {
          id: tripId,
        },
        data: {
          status: "DRAFT",
          isAiGenerated: false,
        },
      });

      revalidateTripPages(tripId);

      return {
        ok: false,
        tripId,
        error: getRetryAiErrorMessage(aiError),
      };
    }
  } catch (error) {
    console.error("GENERATE_TRIP_ITINERARY_ACTION_ERROR", error);

    return {
      ok: false,
      tripId: null,
      error: "Something went wrong while generating this trip itinerary.",
    };
  }
}
