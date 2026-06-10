import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { ensureTripCostBreakdown } from "@/lib/trips/recalculate-trip-cost";
import EditTripClient from "./EditTripClient";

type EditTripPageProps = {
  params: Promise<{
    tripId: string;
  }>;
};

export default async function EditTripPage({ params }: EditTripPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const { tripId } = await params;

  const accessibleTrip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  });

  if (!accessibleTrip) {
    notFound();
  }

  await ensureTripCostBreakdown(tripId);

  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      userId: session.user.id,
    },
    include: {
      fromPlace: true,
      toPlace: true,
      costBreakdown: true,
      days: {
        orderBy: {
          dayNumber: "asc",
        },
        select: {
          id: true,
          dayNumber: true,
          title: true,
          description: true,
          notes: true,
          estimatedCost: true,
        },
      },
      transportOptions: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          tripDayId: true,
          title: true,
          mode: true,
          fromText: true,
          toText: true,
          description: true,
          costType: true,
          pricePerPerson: true,
          totalCost: true,
          isSelected: true,
          notes: true,
        },
      },
      stayOptions: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          tripDayId: true,
          name: true,
          city: true,
          area: true,
          stayType: true,
          budgetLevel: true,
          pricePerNight: true,
          nights: true,
          totalCost: true,
          isSelected: true,
          bestFor: true,
          notes: true,
        },
      },
      mealSuggestions: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          tripDayId: true,
          mealType: true,
          title: true,
          locationName: true,
          estimatedCost: true,
          isSelected: true,
          notes: true,
        },
      },
      activities: {
        orderBy: {
          position: "asc",
        },
        select: {
          id: true,
          tripDayId: true,
          title: true,
          description: true,
          locationName: true,
          address: true,
          startTime: true,
          endTime: true,
          durationMinutes: true,
          category: true,
          estimatedCost: true,
          isSelected: true,
          notes: true,
          position: true,
        },
      },
    },
  });

  if (!trip) {
    notFound();
  }

  return (
    <EditTripClient
      trip={{
        id: trip.id,
        title: trip.title,
        summary: trip.summary,
        daysCount: trip.daysCount,
        peopleCount: trip.peopleCount,
        budgetAmount: trip.budgetAmount?.toString() ?? null,
        costBreakdown: trip.costBreakdown
          ? {
              transportCost: trip.costBreakdown.transportCost.toString(),
              stayCost: trip.costBreakdown.stayCost.toString(),
              foodCost: trip.costBreakdown.foodCost.toString(),
              activityCost: trip.costBreakdown.activityCost.toString(),
              miscCost: trip.costBreakdown.miscCost.toString(),
              totalEstimatedCost:
                trip.costBreakdown.totalEstimatedCost.toString(),
              userBudget: trip.costBreakdown.userBudget?.toString() ?? null,
              budgetStatus: trip.costBreakdown.budgetStatus,
            }
          : null,
        currency: trip.currency,
        tripType: trip.tripType,
        travelPace: trip.travelPace,
        foodPreference: trip.foodPreference,
        transportPreference: trip.transportPreference,
        fromPlace: trip.fromPlace
          ? {
            name: trip.fromPlace.name,
            formattedName: trip.fromPlace.formattedName,
          }
          : null,
        toPlace: trip.toPlace
          ? {
            name: trip.toPlace.name,
            formattedName: trip.toPlace.formattedName,
          }
          : null,
        days: trip.days.map((day) => ({
          id: day.id,
          dayNumber: day.dayNumber,
          title: day.title,
          description: day.description,
          notes: day.notes,
          estimatedCost: day.estimatedCost?.toString() ?? null,
        })),
        transportOptions: trip.transportOptions.map((transport) => ({
          id: transport.id,
          tripDayId: transport.tripDayId,
          title: transport.title,
          mode: transport.mode,
          fromText: transport.fromText,
          toText: transport.toText,
          description: transport.description,
          costType: transport.costType,
          pricePerPerson: transport.pricePerPerson?.toString() ?? null,
          totalCost: transport.totalCost?.toString() ?? null,
          isSelected: transport.isSelected,
          notes: transport.notes,
        })),
        stayOptions: trip.stayOptions.map((stay) => ({
          id: stay.id,
          tripDayId: stay.tripDayId,
          name: stay.name,
          city: stay.city,
          area: stay.area,
          stayType: stay.stayType,
          budgetLevel: stay.budgetLevel,
          pricePerNight: stay.pricePerNight?.toString() ?? null,
          nights: stay.nights,
          totalCost: stay.totalCost?.toString() ?? null,
          isSelected: stay.isSelected,
          bestFor: stay.bestFor,
          notes: stay.notes,
        })),
        mealSuggestions: trip.mealSuggestions.map((meal) => ({
          id: meal.id,
          tripDayId: meal.tripDayId,
          mealType: meal.mealType,
          title: meal.title,
          locationName: meal.locationName,
          estimatedCost: meal.estimatedCost?.toString() ?? null,
          isSelected: meal.isSelected,
          notes: meal.notes,
        })),
        activities: trip.activities.map((activity) => ({
          id: activity.id,
          tripDayId: activity.tripDayId,
          title: activity.title,
          description: activity.description,
          locationName: activity.locationName,
          address: activity.address,
          startTime: activity.startTime,
          endTime: activity.endTime,
          durationMinutes: activity.durationMinutes,
          category: activity.category,
          estimatedCost: activity.estimatedCost?.toString() ?? null,
          isSelected: activity.isSelected,
          notes: activity.notes,
          position: activity.position,
        })),
      }}
    />
  );
}
