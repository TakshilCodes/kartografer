import { ItemSource, TripStatus, TripVisibility, type Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";
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
    },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: {
          activities: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] },
          transportOptions: { orderBy: { createdAt: "asc" } },
          stayOptions: { orderBy: { createdAt: "asc" } },
          mealSuggestions: { orderBy: { createdAt: "asc" } },
        },
      },
      costBreakdown: true,
    },
  });

  if (!sourceTrip) return null;

  const clonedTrip = await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.create({
      data: {
        userId,
        fromPlaceId: sourceTrip.fromPlaceId,
        toPlaceId: sourceTrip.toPlaceId,
        title: `Copy of ${sourceTrip.publicTitle || sourceTrip.title}`,
        summary: sourceTrip.publicDescription || sourceTrip.summary,
        daysCount: sourceTrip.daysCount,
        peopleCount: sourceTrip.peopleCount,
        budgetAmount: sourceTrip.budgetAmount,
        currency: sourceTrip.currency,
        tripType: sourceTrip.tripType,
        travelPace: sourceTrip.travelPace,
        foodPreference: sourceTrip.foodPreference,
        transportPreference: sourceTrip.transportPreference,
        specialNotes: sourceTrip.specialNotes,
        visibility: TripVisibility.PRIVATE,
        status: TripStatus.EDITING,
        isAiGenerated: sourceTrip.isAiGenerated,
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
        originalTripId: sourceTrip.id,
        costBreakdown: sourceTrip.costBreakdown
          ? {
              create: {
                transportCost: sourceTrip.costBreakdown.transportCost,
                stayCost: sourceTrip.costBreakdown.stayCost,
                foodCost: sourceTrip.costBreakdown.foodCost,
                activityCost: sourceTrip.costBreakdown.activityCost,
                miscCost: sourceTrip.costBreakdown.miscCost,
                totalEstimatedCost: sourceTrip.costBreakdown.totalEstimatedCost,
                userBudget: sourceTrip.costBreakdown.userBudget,
                budgetStatus: sourceTrip.costBreakdown.budgetStatus,
              },
            }
          : undefined,
      },
      select: { id: true },
    });

    const dayIdMap = new Map<string, string>();

    for (const sourceDay of sourceTrip.days) {
      const day = await tx.tripDay.create({
        data: {
          tripId: trip.id,
          dayNumber: sourceDay.dayNumber,
          title: sourceDay.title,
          description: sourceDay.description,
          date: sourceDay.date,
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

    for (const sourceDay of sourceTrip.days) {
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
          category: activity.category,
          estimatedCost: activity.estimatedCost,
          isSelected: activity.isSelected,
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
          mode: transport.mode,
          fromText: transport.fromText,
          toText: transport.toText,
          description: transport.description,
          costType: transport.costType,
          pricePerPerson: transport.pricePerPerson,
          totalCost: transport.totalCost,
          isSelected: transport.isSelected,
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
          stayType: stay.stayType,
          budgetLevel: stay.budgetLevel,
          pricePerNight: stay.pricePerNight,
          nights: stay.nights,
          totalCost: stay.totalCost,
          isSelected: stay.isSelected,
          bestFor: stay.bestFor,
          source: ItemSource.CLONED,
          notes: stay.notes,
        });
      });

      sourceDay.mealSuggestions.forEach((meal) => {
        meals.push({
          tripId: trip.id,
          tripDayId: clonedDayId,
          mealType: meal.mealType,
          title: meal.title,
          locationName: meal.locationName,
          estimatedCost: meal.estimatedCost,
          isSelected: meal.isSelected,
          source: ItemSource.CLONED,
          notes: meal.notes,
        });
      });
    }

    if (activities.length > 0) await tx.tripActivity.createMany({ data: activities });
    if (transports.length > 0) await tx.transportOption.createMany({ data: transports });
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