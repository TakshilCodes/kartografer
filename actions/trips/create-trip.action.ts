"use server";

import { getServerSession } from "next-auth";

import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { createTripSchema } from "@/lib/validations/trip.validation";

import {
    FoodPreference,
    PlaceProvider,
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
    }
    | {
        ok: false;
        tripId: null;
        error: string;
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

async function findOrCreatePlace(
    tx: any,
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

        const data = parsed.data;

        const fromPlaceInput = data.fromPlace;
        const toPlaceInput = data.toPlace;

        const fromName = normalizePlaceName(fromPlaceInput.name);
        const destinationName = normalizePlaceName(toPlaceInput.name);


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

                    tripType: mapTripType(data.tripType),
                    transportPreference: mapTransportPreference(data.transport),
                    foodPreference: mapFoodPreference(data.food),
                    travelPace: mapTravelPace(data.pace),

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
                },
            });

            return trip;
        });

        return {
            ok: true,
            tripId: result.id,
            error: null,
        };
    } catch (error) {
        console.error("CREATE_TRIP_ACTION_ERROR", error);

        return {
            ok: false,
            tripId: null,
            error: "Something went wrong while creating your trip.",
        };
    }
}