import type { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";

export const PUBLIC_TRIP_SNAPSHOT_VERSION = 1;

type PublicSnapshotFieldOverrides = {
  publicTitle: string;
  publicDescription: string | null;
  destination: string;
  coverImageUrl: string | null;
  budgetStyle: string | null;
  travelStyle: string | null;
  tags: string[];
  publishedAt: Date;
};

export type PublicTripSnapshot = {
  version: typeof PUBLIC_TRIP_SNAPSHOT_VERSION;
  id: string;
  title: string;
  summary: string | null;
  publicTitle: string | null;
  publicDescription: string | null;
  coverImageUrl: string | null;
  destination: string | null;
  durationDays: number | null;
  budgetStyle: string | null;
  travelStyle: string | null;
  tags: string[];
  copiedCount: number;
  publishedAt: string | null;
  daysCount: number;
  peopleCount: number;
  budgetAmount: number | null;
  currency: string;
  tripType: string;
  travelPace: string;
  foodPreference: string;
  transportPreference: string;
  specialNotes: string | null;
  isAiGenerated: boolean;
  fromPlaceId: string | null;
  toPlaceId: string | null;
  fromPlace: { name: string; formattedName: string } | null;
  toPlace: { name: string; formattedName: string } | null;
  sourceContentUpdatedAt: string;
  costBreakdown: {
    totalEstimatedCost: number;
    transportCost: number;
    stayCost: number;
    foodCost: number;
    activityCost: number;
    miscCost: number;
    userBudget: number | null;
    budgetStatus: string;
  } | null;
  days: Array<{
    id: string;
    dayNumber: number;
    title: string;
    description: string | null;
    notes: string | null;
    estimatedCost: number | null;
    transportOptions: Array<{
      id: string;
      title: string;
      mode: string;
      fromText: string | null;
      toText: string | null;
      description: string | null;
      costType: string;
      totalCost: number | null;
      pricePerPerson: number | null;
      notes: string | null;
    }>;
    stayOptions: Array<{
      id: string;
      name: string;
      city: string | null;
      area: string | null;
      stayType: string;
      budgetLevel: string;
      totalCost: number | null;
      pricePerNight: number | null;
      nights: number | null;
      bestFor: string | null;
      notes: string | null;
    }>;
    mealSuggestions: Array<{
      id: string;
      mealType: string;
      title: string;
      locationName: string | null;
      estimatedCost: number | null;
      notes: string | null;
    }>;
    activities: Array<{
      id: string;
      title: string;
      description: string | null;
      locationName: string | null;
      address: string | null;
      category: string;
      startTime: string | null;
      endTime: string | null;
      durationMinutes: number | null;
      estimatedCost: number | null;
      notes: string | null;
      position: number;
    }>;
  }>;
};

export const publicTripSnapshotSelect = {
  id: true,
  fromPlaceId: true,
  toPlaceId: true,
  title: true,
  summary: true,
  daysCount: true,
  peopleCount: true,
  budgetAmount: true,
  currency: true,
  tripType: true,
  travelPace: true,
  foodPreference: true,
  transportPreference: true,
  specialNotes: true,
  isAiGenerated: true,
  copiedCount: true,
  updatedAt: true,
  fromPlace: { select: { name: true, formattedName: true } },
  toPlace: { select: { name: true, formattedName: true } },
  costBreakdown: {
    select: {
      transportCost: true,
      stayCost: true,
      foodCost: true,
      activityCost: true,
      miscCost: true,
      totalEstimatedCost: true,
      userBudget: true,
      budgetStatus: true,
      updatedAt: true,
    },
  },
  days: {
    orderBy: { dayNumber: "asc" },
    select: {
      id: true,
      dayNumber: true,
      title: true,
      description: true,
      notes: true,
      estimatedCost: true,
      updatedAt: true,
      transportOptions: {
        where: { isSelected: true },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          title: true,
          mode: true,
          fromText: true,
          toText: true,
          description: true,
          costType: true,
          totalCost: true,
          pricePerPerson: true,
          notes: true,
          updatedAt: true,
        },
      },
      stayOptions: {
        where: { isSelected: true },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          city: true,
          area: true,
          stayType: true,
          budgetLevel: true,
          totalCost: true,
          pricePerNight: true,
          nights: true,
          bestFor: true,
          notes: true,
          updatedAt: true,
        },
      },
      mealSuggestions: {
        where: { isSelected: true },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          mealType: true,
          title: true,
          locationName: true,
          estimatedCost: true,
          notes: true,
          updatedAt: true,
        },
      },
      activities: {
        where: { isSelected: true },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          title: true,
          description: true,
          locationName: true,
          address: true,
          category: true,
          startTime: true,
          endTime: true,
          durationMinutes: true,
          estimatedCost: true,
          notes: true,
          position: true,
          updatedAt: true,
        },
      },
    },
  },
} satisfies Prisma.TripSelect;

type PublicSnapshotTrip = Prisma.TripGetPayload<{
  select: typeof publicTripSnapshotSelect;
}>;

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  const numberValue = Number(value);

  return Number.isNaN(numberValue) ? null : numberValue;
}

function latestDate(current: Date, next?: Date | null) {
  if (!next) return current;

  return next.getTime() > current.getTime() ? next : current;
}

export function getPublicSnapshotContentUpdatedAt(trip: PublicSnapshotTrip) {
  let latest = trip.updatedAt;

  latest = latestDate(latest, trip.costBreakdown?.updatedAt);

  trip.days.forEach((day) => {
    latest = latestDate(latest, day.updatedAt);
    day.activities.forEach((item) => {
      latest = latestDate(latest, item.updatedAt);
    });
    day.transportOptions.forEach((item) => {
      latest = latestDate(latest, item.updatedAt);
    });
    day.stayOptions.forEach((item) => {
      latest = latestDate(latest, item.updatedAt);
    });
    day.mealSuggestions.forEach((item) => {
      latest = latestDate(latest, item.updatedAt);
    });
  });

  return latest;
}

export function createPublicTripSnapshot({
  trip,
  publicFields,
}: {
  trip: PublicSnapshotTrip;
  publicFields: PublicSnapshotFieldOverrides;
}): PublicTripSnapshot {
  const sourceContentUpdatedAt = getPublicSnapshotContentUpdatedAt(trip);

  return {
    version: PUBLIC_TRIP_SNAPSHOT_VERSION,
    id: trip.id,
    title: trip.title,
    summary: trip.summary,
    publicTitle: publicFields.publicTitle,
    publicDescription: publicFields.publicDescription,
    coverImageUrl: publicFields.coverImageUrl,
    destination: publicFields.destination,
    durationDays: trip.daysCount,
    budgetStyle: publicFields.budgetStyle,
    travelStyle: publicFields.travelStyle,
    tags: publicFields.tags,
    copiedCount: trip.copiedCount,
    publishedAt: publicFields.publishedAt.toISOString(),
    daysCount: trip.daysCount,
    peopleCount: trip.peopleCount,
    budgetAmount: toNumber(trip.budgetAmount),
    currency: trip.currency,
    tripType: trip.tripType,
    travelPace: trip.travelPace,
    foodPreference: trip.foodPreference,
    transportPreference: trip.transportPreference,
    specialNotes: trip.specialNotes,
    isAiGenerated: trip.isAiGenerated,
    fromPlaceId: trip.fromPlaceId,
    toPlaceId: trip.toPlaceId,
    fromPlace: trip.fromPlace,
    toPlace: trip.toPlace,
    sourceContentUpdatedAt: sourceContentUpdatedAt.toISOString(),
    costBreakdown: trip.costBreakdown
      ? {
          totalEstimatedCost:
            toNumber(trip.costBreakdown.totalEstimatedCost) ?? 0,
          transportCost: toNumber(trip.costBreakdown.transportCost) ?? 0,
          stayCost: toNumber(trip.costBreakdown.stayCost) ?? 0,
          foodCost: toNumber(trip.costBreakdown.foodCost) ?? 0,
          activityCost: toNumber(trip.costBreakdown.activityCost) ?? 0,
          miscCost: toNumber(trip.costBreakdown.miscCost) ?? 0,
          userBudget: toNumber(trip.costBreakdown.userBudget),
          budgetStatus: trip.costBreakdown.budgetStatus,
        }
      : null,
    days: trip.days.map((day) => ({
      id: day.id,
      dayNumber: day.dayNumber,
      title: day.title,
      description: day.description,
      notes: day.notes,
      estimatedCost: toNumber(day.estimatedCost),
      transportOptions: day.transportOptions.map((transport) => ({
        id: transport.id,
        title: transport.title,
        mode: transport.mode,
        fromText: transport.fromText,
        toText: transport.toText,
        description: transport.description,
        costType: transport.costType,
        totalCost: toNumber(transport.totalCost),
        pricePerPerson: toNumber(transport.pricePerPerson),
        notes: transport.notes,
      })),
      stayOptions: day.stayOptions.map((stay) => ({
        id: stay.id,
        name: stay.name,
        city: stay.city,
        area: stay.area,
        stayType: stay.stayType,
        budgetLevel: stay.budgetLevel,
        totalCost: toNumber(stay.totalCost),
        pricePerNight: toNumber(stay.pricePerNight),
        nights: stay.nights,
        bestFor: stay.bestFor,
        notes: stay.notes,
      })),
      mealSuggestions: day.mealSuggestions.map((meal) => ({
        id: meal.id,
        mealType: meal.mealType,
        title: meal.title,
        locationName: meal.locationName,
        estimatedCost: toNumber(meal.estimatedCost),
        notes: meal.notes,
      })),
      activities: day.activities.map((activity) => ({
        id: activity.id,
        title: activity.title,
        description: activity.description,
        locationName: activity.locationName,
        address: activity.address,
        category: activity.category,
        startTime: activity.startTime,
        endTime: activity.endTime,
        durationMinutes: activity.durationMinutes,
        estimatedCost: toNumber(activity.estimatedCost),
        notes: activity.notes,
        position: activity.position,
      })),
    })),
  };
}

export async function getTripForPublicSnapshot({
  tripId,
  userId,
}: {
  tripId: string;
  userId: string;
}) {
  return prisma.trip.findFirst({
    where: { id: tripId, userId },
    select: publicTripSnapshotSelect,
  });
}

export function readPublicTripSnapshot(
  value: unknown,
): PublicTripSnapshot | null {
  if (!value || typeof value !== "object") return null;

  const snapshot = value as Partial<PublicTripSnapshot>;

  if (snapshot.version !== PUBLIC_TRIP_SNAPSHOT_VERSION) return null;
  if (typeof snapshot.id !== "string") return null;
  if (!Array.isArray(snapshot.days)) return null;

  return snapshot as PublicTripSnapshot;
}
