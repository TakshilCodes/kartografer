import {
  FoodPreference,
  Prisma,
  TransportPreference,
  TravelPace,
  TripStatus,
  TripType,
  TripVisibility,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { createUniquePublicShareSlug } from "@/lib/trips/public-share-slug";
import type { CreateTripInput } from "@/lib/validations/trip.validation";

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

function normalizePlaceName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

async function findOrCreatePlace(
  tx: Prisma.TransactionClient,
  placeInput: NonNullable<CreateTripInput["fromPlace"]>,
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

  if (existingPlace) return existingPlace;

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

export async function createBaseTrip({
  userId,
  data,
  status,
}: {
  userId: string;
  data: CreateTripInput;
  status: TripStatus;
}) {
  const userSettings = await prisma.userSettings.findUnique({
    where: { userId },
    select: {
      defaultTripVisibility: true,
      enablePublicSharingByDefault: true,
    },
  });

  const enablePublicSharing =
    userSettings?.enablePublicSharingByDefault ?? false;
  const publicShareSlug = enablePublicSharing
    ? await createUniquePublicShareSlug()
    : null;

  const fromName = normalizePlaceName(data.fromPlace.name);
  const destinationName = normalizePlaceName(data.toPlace.name);
  const tripType = mapTripType(data.tripType);
  const transportPreference = mapTransportPreference(data.transport);
  const foodPreference = mapFoodPreference(data.food);
  const travelPace = mapTravelPace(data.pace);

  const trip = await prisma.$transaction(async (tx) => {
    const fromPlace = await findOrCreatePlace(tx, data.fromPlace);
    const toPlace = await findOrCreatePlace(tx, data.toPlace);

    return tx.trip.create({
      data: {
        userId,
        fromPlaceId: fromPlace.id,
        toPlaceId: toPlace.id,
        title: data.days + "-Day " + destinationName + " Trip",
        summary:
          "A " +
          data.days +
          "-day trip from " +
          fromName +
          " to " +
          destinationName +
          ".",
        daysCount: data.days,
        peopleCount: data.people,
        budgetAmount: data.budget,
        currency: "INR",
        tripType,
        transportPreference,
        foodPreference,
        travelPace,
        specialNotes: data.notes || null,
        visibility:
          userSettings?.defaultTripVisibility ?? TripVisibility.PRIVATE,
        status,
        isAiGenerated: false,
        isPublicShareEnabled: enablePublicSharing,
        publicShareSlug,
        publicSharedAt: enablePublicSharing ? new Date() : null,
        days: {
          create: Array.from({ length: data.days }, (_, index) => ({
            dayNumber: index + 1,
            title: "Day " + (index + 1),
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
  });

  return {
    ...trip,
    fromName,
    destinationName,
    tripType,
    transportPreference,
    foodPreference,
    travelPace,
  };
}
