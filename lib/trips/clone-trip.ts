import {
  ActivityCategory,
  BudgetStatus,
  BudgetLevel,
  CostType,
  FoodPreference,
  ItemSource,
  MealType,
  StayType,
  TransportMode,
  TransportPreference,
  TravelPace,
  TripStatus,
  TripType,
  TripVisibility,
  Prisma,
} from "@prisma/client";

import prisma from "@/lib/prisma";
import { readPublicTripSnapshot } from "@/lib/explore/public-trip-snapshot";
import { recalculateTripCost } from "@/lib/trips/recalculate-trip-cost";

export async function clonePublicTripForUser({
  publicTripId,
  userId,
}: {
  publicTripId: string;
  userId: string;
}) {
  const sourceTrip = await prisma.trip.findFirst({
    where: {
      id: publicTripId,
      isPublic: true,
      publicSnapshotUpdatedAt: { not: null },
    },
    select: {
      id: true,
      publicSnapshotJson: true,
    },
  });

  if (!sourceTrip) return null;

  const snapshot = readPublicTripSnapshot(sourceTrip.publicSnapshotJson);

  if (!snapshot) return null;

  const clonedTrip = await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.create({
      data: {
        userId,
        fromPlaceId: snapshot.fromPlaceId,
        toPlaceId: snapshot.toPlaceId,
        title: `Copy of ${snapshot.publicTitle || snapshot.title}`,
        summary: snapshot.publicDescription || snapshot.summary,
        daysCount: snapshot.daysCount,
        peopleCount: snapshot.peopleCount,
        budgetAmount: snapshot.budgetAmount,
        currency: snapshot.currency,
        tripType: snapshot.tripType as TripType,
        travelPace: snapshot.travelPace as TravelPace,
        foodPreference: snapshot.foodPreference as FoodPreference,
        transportPreference:
          snapshot.transportPreference as TransportPreference,
        specialNotes: snapshot.specialNotes,
        visibility: TripVisibility.PRIVATE,
        status: TripStatus.EDITING,
        isAiGenerated: snapshot.isAiGenerated,
        isPublicShareEnabled: false,
        publicShareSlug: null,
        publicSharedAt: null,
        isPublic: false,
        publicTitle: null,
        publicDescription: null,
        coverImageUrl: null,
        destination: null,
        durationDays: null,
        budgetStyle: null,
        travelStyle: null,
        tags: [],
        copiedCount: 0,
        publishedAt: null,
        publicSnapshotJson: Prisma.JsonNull,
        publicSnapshotUpdatedAt: null,
        publicSnapshotContentUpdatedAt: null,
        originalTripId: sourceTrip.id,
        costBreakdown: snapshot.costBreakdown
          ? {
              create: {
                transportCost: snapshot.costBreakdown.transportCost,
                stayCost: snapshot.costBreakdown.stayCost,
                foodCost: snapshot.costBreakdown.foodCost,
                activityCost: snapshot.costBreakdown.activityCost,
                miscCost: snapshot.costBreakdown.miscCost,
                totalEstimatedCost: snapshot.costBreakdown.totalEstimatedCost,
                userBudget: snapshot.costBreakdown.userBudget,
                budgetStatus: snapshot.costBreakdown
                  .budgetStatus as BudgetStatus,
              },
            }
          : undefined,
      },
      select: { id: true },
    });

    const dayIdMap = new Map<string, string>();

    for (const sourceDay of snapshot.days) {
      const day = await tx.tripDay.create({
        data: {
          tripId: trip.id,
          dayNumber: sourceDay.dayNumber,
          title: sourceDay.title,
          description: sourceDay.description,
          estimatedCost: sourceDay.estimatedCost,
          notes: sourceDay.notes,
        },
        select: { id: true },
      });

      dayIdMap.set(sourceDay.id, day.id);
    }

    const activities: Prisma.TripActivityCreateManyInput[] = [];
    const transports: Prisma.TransportOptionCreateManyInput[] = [];
    const stays: Prisma.StayOptionCreateManyInput[] = [];
    const meals: Prisma.MealSuggestionCreateManyInput[] = [];

    for (const sourceDay of snapshot.days) {
      const clonedDayId = dayIdMap.get(sourceDay.id);

      if (!clonedDayId) continue;

      sourceDay.activities.forEach((activity) => {
        activities.push({
          tripId: trip.id,
          tripDayId: clonedDayId,
          title: activity.title,
          description: activity.description,
          locationName: activity.locationName,
          address: activity.address,
          startTime: activity.startTime,
          endTime: activity.endTime,
          durationMinutes: activity.durationMinutes,
          category: activity.category as ActivityCategory,
          estimatedCost: activity.estimatedCost,
          isSelected: true,
          source: ItemSource.CLONED,
          notes: activity.notes,
          position: activity.position,
        });
      });

      sourceDay.transportOptions.forEach((transport) => {
        transports.push({
          tripId: trip.id,
          tripDayId: clonedDayId,
          title: transport.title,
          mode: transport.mode as TransportMode,
          fromText: transport.fromText,
          toText: transport.toText,
          description: transport.description,
          costType: transport.costType as CostType,
          pricePerPerson: transport.pricePerPerson,
          totalCost: transport.totalCost,
          isSelected: true,
          source: ItemSource.CLONED,
          notes: transport.notes,
        });
      });

      sourceDay.stayOptions.forEach((stay) => {
        stays.push({
          tripId: trip.id,
          tripDayId: clonedDayId,
          name: stay.name,
          city: stay.city,
          area: stay.area,
          stayType: stay.stayType as StayType,
          budgetLevel: stay.budgetLevel as BudgetLevel,
          pricePerNight: stay.pricePerNight,
          nights: stay.nights,
          totalCost: stay.totalCost,
          isSelected: true,
          bestFor: stay.bestFor,
          source: ItemSource.CLONED,
          notes: stay.notes,
        });
      });

      sourceDay.mealSuggestions.forEach((meal) => {
        meals.push({
          tripId: trip.id,
          tripDayId: clonedDayId,
          mealType: meal.mealType as MealType,
          title: meal.title,
          locationName: meal.locationName,
          estimatedCost: meal.estimatedCost,
          isSelected: true,
          source: ItemSource.CLONED,
          notes: meal.notes,
        });
      });
    }

    if (activities.length > 0)
      await tx.tripActivity.createMany({ data: activities });
    if (transports.length > 0)
      await tx.transportOption.createMany({ data: transports });
    if (stays.length > 0) await tx.stayOption.createMany({ data: stays });
    if (meals.length > 0) await tx.mealSuggestion.createMany({ data: meals });

    await tx.trip.update({
      where: { id: sourceTrip.id },
      data: { copiedCount: { increment: 1 } },
    });

    return trip;
  });

  await recalculateTripCost(clonedTrip.id);

  return clonedTrip;
}
