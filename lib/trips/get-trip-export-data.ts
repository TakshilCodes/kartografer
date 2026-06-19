import prisma from "@/lib/prisma";

function serializeMoney(value: unknown) {
  if (value === null || value === undefined) return null;

  return value.toString();
}

export type TripExportTransport = {
  id: string;
  title: string;
  mode: string;
  fromText: string | null;
  toText: string | null;
  description: string | null;
  costType: string;
  pricePerPerson: string | null;
  totalCost: string | null;
  notes: string | null;
};

export type TripExportStay = {
  id: string;
  name: string;
  city: string | null;
  area: string | null;
  stayType: string;
  budgetLevel: string;
  pricePerNight: string | null;
  nights: number | null;
  totalCost: string | null;
  bestFor: string | null;
  notes: string | null;
};

export type TripExportMeal = {
  id: string;
  mealType: string;
  title: string;
  locationName: string | null;
  estimatedCost: string | null;
  notes: string | null;
};

export type TripExportActivity = {
  id: string;
  title: string;
  description: string | null;
  locationName: string | null;
  address: string | null;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  category: string;
  estimatedCost: string | null;
  notes: string | null;
};

export type TripExportDay = {
  id: string;
  dayNumber: number;
  title: string;
  description: string | null;
  notes: string | null;
  estimatedCost: string | null;
  transports: TripExportTransport[];
  stays: TripExportStay[];
  meals: TripExportMeal[];
  activities: TripExportActivity[];
};

export type TripExportData = {
  id: string;
  title: string;
  summary: string | null;
  daysCount: number;
  peopleCount: number;
  budgetAmount: string | null;
  currency: string;
  tripType: string;
  travelPace: string;
  foodPreference: string;
  transportPreference: string;
  specialNotes: string | null;
  createdAt: string;
  updatedAt: string;
  fromPlace: {
    name: string;
    formattedName: string;
  } | null;
  toPlace: {
    name: string;
    formattedName: string;
  } | null;
  costBreakdown: {
    transportCost: string;
    stayCost: string;
    foodCost: string;
    activityCost: string;
    miscCost: string;
    totalEstimatedCost: string;
    userBudget: string | null;
    budgetStatus: string;
  } | null;
  days: TripExportDay[];
  hasItineraryDetails: boolean;
};

export async function getTripExportData(
  tripId: string,
  userId: string
): Promise<TripExportData | null> {
  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      userId,
    },
    select: {
      id: true,
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
      createdAt: true,
      updatedAt: true,
      fromPlace: {
        select: {
          name: true,
          formattedName: true,
        },
      },
      toPlace: {
        select: {
          name: true,
          formattedName: true,
        },
      },
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
        },
      },
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
          transportOptions: {
            where: {
              isSelected: true,
            },
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              title: true,
              mode: true,
              fromText: true,
              toText: true,
              description: true,
              costType: true,
              pricePerPerson: true,
              totalCost: true,
              notes: true,
            },
          },
          stayOptions: {
            where: {
              isSelected: true,
            },
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              name: true,
              city: true,
              area: true,
              stayType: true,
              budgetLevel: true,
              pricePerNight: true,
              nights: true,
              totalCost: true,
              bestFor: true,
              notes: true,
            },
          },
          mealSuggestions: {
            where: {
              isSelected: true,
            },
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              mealType: true,
              title: true,
              locationName: true,
              estimatedCost: true,
              notes: true,
            },
          },
          activities: {
            where: {
              isSelected: true,
            },
            orderBy: [
              {
                position: "asc",
              },
              {
                createdAt: "asc",
              },
            ],
            select: {
              id: true,
              title: true,
              description: true,
              locationName: true,
              address: true,
              startTime: true,
              endTime: true,
              durationMinutes: true,
              category: true,
              estimatedCost: true,
              notes: true,
            },
          },
        },
      },
    },
  });

  if (!trip) return null;

  const days = trip.days.map((day) => ({
    id: day.id,
    dayNumber: day.dayNumber,
    title: day.title,
    description: day.description,
    notes: day.notes,
    estimatedCost: serializeMoney(day.estimatedCost),
    transports: day.transportOptions.map((transport) => ({
      ...transport,
      mode: transport.mode.toString(),
      costType: transport.costType.toString(),
      pricePerPerson: serializeMoney(transport.pricePerPerson),
      totalCost: serializeMoney(transport.totalCost),
    })),
    stays: day.stayOptions.map((stay) => ({
      ...stay,
      stayType: stay.stayType.toString(),
      budgetLevel: stay.budgetLevel.toString(),
      pricePerNight: serializeMoney(stay.pricePerNight),
      totalCost: serializeMoney(stay.totalCost),
    })),
    meals: day.mealSuggestions.map((meal) => ({
      ...meal,
      mealType: meal.mealType.toString(),
      estimatedCost: serializeMoney(meal.estimatedCost),
    })),
    activities: day.activities.map((activity) => ({
      ...activity,
      category: activity.category.toString(),
      estimatedCost: serializeMoney(activity.estimatedCost),
    })),
  }));

  const hasItineraryDetails = days.some(
    (day) =>
      day.transports.length > 0 ||
      day.stays.length > 0 ||
      day.meals.length > 0 ||
      day.activities.length > 0
  );

  return {
    id: trip.id,
    title: trip.title,
    summary: trip.summary,
    daysCount: trip.daysCount,
    peopleCount: trip.peopleCount,
    budgetAmount: serializeMoney(trip.budgetAmount),
    currency: trip.currency,
    tripType: trip.tripType.toString(),
    travelPace: trip.travelPace.toString(),
    foodPreference: trip.foodPreference.toString(),
    transportPreference: trip.transportPreference.toString(),
    specialNotes: trip.specialNotes,
    createdAt: trip.createdAt.toISOString(),
    updatedAt: trip.updatedAt.toISOString(),
    fromPlace: trip.fromPlace,
    toPlace: trip.toPlace,
    costBreakdown: trip.costBreakdown
      ? {
          transportCost: trip.costBreakdown.transportCost.toString(),
          stayCost: trip.costBreakdown.stayCost.toString(),
          foodCost: trip.costBreakdown.foodCost.toString(),
          activityCost: trip.costBreakdown.activityCost.toString(),
          miscCost: trip.costBreakdown.miscCost.toString(),
          totalEstimatedCost:
            trip.costBreakdown.totalEstimatedCost.toString(),
          userBudget: serializeMoney(trip.costBreakdown.userBudget),
          budgetStatus: trip.costBreakdown.budgetStatus.toString(),
        }
      : null,
    days,
    hasItineraryDetails,
  };
}
