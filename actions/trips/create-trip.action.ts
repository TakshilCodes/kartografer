"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { createTripSchema } from "@/lib/validations/trip.validation";
import { generateTripWithAi } from "@/lib/ai/ai-client";
import { saveGeneratedTrip } from "@/lib/trips/save-generated-trip";
import { recalculateTripCost } from "@/lib/trips/recalculate-trip-cost";

import {
    FoodPreference,
    Prisma,
    TransportPreference,
    TravelPace,
    TripStatus,
    TripType,
    TripVisibility,
} from "@prisma/client";

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
        errorKind?: "AUTH" | "VALIDATION" | "AI_RATE_LIMIT" | "AI_BUSY" | "AI_FAILED" | "UNKNOWN";
    };

function mapTripType(value: string): TripType {
    const map: Record<string, TripType> = {
        "Family Trip": TripType.FAMILY,
        Adventure: TripType.ADVENTURE,
        "Relaxed Vacation": TripType.OTHER,
        "Road Trip": TripType.ADVENTURE,
        "Religious Trip": TripType.RELIGIOUS,
        "Budget Trip": TripType.BUDGET,
    };

    return map[value] ?? TripType.OTHER;
}

function mapTransportPreference(value: string): TransportPreference {
    const map: Record<string, TransportPreference> = {
        Any: TransportPreference.MIXED,
        Train: TransportPreference.TRAIN,
        Flight: TransportPreference.FLIGHT,
        Cab: TransportPreference.CAB,
        Bus: TransportPreference.BUS,
        "Self Drive": TransportPreference.SELF_DRIVE,
    };

    return map[value] ?? TransportPreference.MIXED;
}

function mapFoodPreference(value: string): FoodPreference {
    const map: Record<string, FoodPreference> = {
        Vegetarian: FoodPreference.VEGETARIAN,
        "Non-Vegetarian": FoodPreference.NON_VEGETARIAN,
        Jain: FoodPreference.JAIN,
        Any: FoodPreference.NO_PREFERENCE,
    };

    return map[value] ?? FoodPreference.NO_PREFERENCE;
}

function mapTravelPace(value: string): TravelPace {
    const map: Record<string, TravelPace> = {
        Relaxed: TravelPace.RELAXED,
        Balanced: TravelPace.BALANCED,
        Fast: TravelPace.FAST,
    };

    return map[value] ?? TravelPace.BALANCED;
}

function createTripTitle(destination: string, days: number) {
    return `${days}-Day ${destination} Trip`;
}

function normalizePlaceName(value: string) {
    return value.trim().replace(/\s+/g, " ");
}

function revalidateTripShell(tripId: string) {
    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/new");
    revalidatePath("/dashboard/trips");
    revalidatePath(`/dashboard/trips/${tripId}`);
}

function getAiErrorDetails(error: unknown): {
    error: string;
    errorKind: "AI_RATE_LIMIT" | "AI_BUSY" | "AI_FAILED";
} {
    const status =
        typeof error === "object" &&
            error !== null &&
            "status" in error &&
            typeof error.status === "number"
            ? error.status
            : null;

    const message =
        error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

    if (
        status === 429 ||
        message.includes("quota") ||
        message.includes("rate limit") ||
        message.includes("resource_exhausted")
    ) {
        return {
            errorKind: "AI_RATE_LIMIT",
            error:
                "AI trip generation limit has been reached for now. Your trip draft was saved, but the itinerary could not be generated yet.",
        };
    }

    if (
        status === 500 ||
        status === 502 ||
        status === 503 ||
        status === 504 ||
        message.includes("overloaded") ||
        message.includes("unavailable") ||
        message.includes("busy")
    ) {
        return {
            errorKind: "AI_BUSY",
            error:
                "Kartografer AI is in high demand right now. Your trip draft was saved, but the itinerary could not be generated yet.",
        };
    }

    return {
        errorKind: "AI_FAILED",
        error:
            "Kartografer AI could not generate the itinerary right now. Your trip draft was saved, so you can open it and edit manually.",
    };
}

async function findOrCreatePlace(
    tx: Prisma.TransactionClient,
    placeInput: {
        provider: "MANUAL" | "GEOAPIFY" | "MAPBOX" | "GOOGLE" | "NOMINATIM";
        providerPlaceId: string;
        name: string;
        formattedName: string;
        city?: string | null;
        state?: string | null;
        country: string;
        countryCode: string;
        lat?: number | null;
        lng?: number | null;
    }
) {
    const existingPlace = await tx.place.findFirst({
        where: {
            name: {
                equals: placeInput.name,
                mode: "insensitive",
            },
            state: placeInput.state,
            countryCode: placeInput.countryCode,
        },
    });

    if (existingPlace) {
        return existingPlace;
    }

    return tx.place.create({
        data: {
            provider: placeInput.provider,
            providerPlaceId: placeInput.providerPlaceId,
            name: placeInput.name,
            formattedName: placeInput.formattedName,
            city: placeInput.city,
            state: placeInput.state,
            country: placeInput.country,
            countryCode: placeInput.countryCode,
            lat: placeInput.lat,
            lng: placeInput.lng,
        },
    });
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

        const fromPlaceInput = data.fromPlace;
        const toPlaceInput = data.toPlace;

        const fromName = normalizePlaceName(fromPlaceInput.name);
        const destinationName = normalizePlaceName(toPlaceInput.name);

        const tripType = mapTripType(data.tripType);
        const transportPreference = mapTransportPreference(data.transport);
        const foodPreference = mapFoodPreference(data.food);
        const travelPace = mapTravelPace(data.pace);

        const result = await prisma.$transaction(async (tx) => {
            const fromPlace = await findOrCreatePlace(tx, fromPlaceInput);
            const toPlace = await findOrCreatePlace(tx, toPlaceInput);

            const trip = await tx.trip.create({
                data: {
                    userId: session.user.id,

                    fromPlaceId: fromPlace.id,
                    toPlaceId: toPlace.id,

                    title: createTripTitle(destinationName, data.days),
                    summary: `A ${data.days}-day trip from ${fromName} to ${destinationName}.`,

                    daysCount: data.days,
                    peopleCount: data.people,

                    budgetAmount: data.budget,
                    currency: "INR",

                    tripType,
                    transportPreference,
                    foodPreference,
                    travelPace,

                    specialNotes: data.notes || null,

                    visibility: TripVisibility.PRIVATE,
                    status: TripStatus.DRAFT,
                    isAiGenerated: false,

                    days: {
                        create: Array.from({ length: data.days }, (_, index) => ({
                            dayNumber: index + 1,
                            title: `Day ${index + 1}`,
                            description: null,
                        })),
                    },

                    costBreakdown: {
                        create: {
                            userBudget: data.budget,
                        },
                    },
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
                },
            });

            return trip;
        });

        try {
            const generatedTrip = await generateTripWithAi({
                fromPlace: result.fromPlace?.formattedName ?? fromName,
                toPlace: result.toPlace?.formattedName ?? destinationName,
                daysCount: data.days,
                peopleCount: data.people,
                budgetAmount: data.budget ?? null,
                currency: "INR",
                tripType,
                travelPace,
                foodPreference,
                transportPreference,
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
            const aiErrorDetails = getAiErrorDetails(aiError);

            await prisma.trip.update({
                where: {
                    id: result.id,
                },
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
