import { BudgetStatus } from "@prisma/client";

import prisma from "@/lib/prisma";

type DayCostMap = Map<string, number>;

function getNumberValue(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;

  const numberValue = Number(value);

  return Number.isNaN(numberValue) ? 0 : numberValue;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function addDayCost(dayCosts: DayCostMap, dayId: string | null, cost: number) {
  if (!dayId) return;

  dayCosts.set(dayId, roundMoney((dayCosts.get(dayId) ?? 0) + cost));
}

function getBudgetStatus(totalCost: number, userBudget: number | null) {
  if (!userBudget || userBudget <= 0 || totalCost <= 0) {
    return BudgetStatus.UNKNOWN;
  }

  const budgetRatio = totalCost / userBudget;

  if (budgetRatio <= 0.8) {
    return BudgetStatus.BUDGET_FRIENDLY;
  }

  if (budgetRatio <= 1) {
    return BudgetStatus.UNDER_BUDGET;
  }

  if (budgetRatio <= 1.1) {
    return BudgetStatus.SLIGHTLY_OVER;
  }

  return BudgetStatus.OVER_BUDGET;
}

function getTransportCost(transport: {
  costType: string;
  pricePerPerson: unknown;
  totalCost: unknown;
}, peopleCount: number) {
  if (transport.costType === "PER_PERSON") {
    return roundMoney(getNumberValue(transport.pricePerPerson) * peopleCount);
  }

  return roundMoney(getNumberValue(transport.totalCost));
}

function getStayCost(stay: {
  pricePerNight: unknown;
  nights: number | null;
  totalCost: unknown;
}) {
  const explicitTotal = getNumberValue(stay.totalCost);

  if (explicitTotal > 0) {
    return roundMoney(explicitTotal);
  }

  const nights = stay.nights === null ? 1 : Math.max(stay.nights, 0);

  return roundMoney(getNumberValue(stay.pricePerNight) * nights);
}

export async function recalculateTripCost(tripId: string) {
  const trip = await prisma.trip.findUnique({
    where: {
      id: tripId,
    },
    select: {
      id: true,
      peopleCount: true,
      budgetAmount: true,
      days: {
        select: {
          id: true,
        },
      },
      transportOptions: {
        where: {
          isSelected: true,
        },
        select: {
          tripDayId: true,
          costType: true,
          pricePerPerson: true,
          totalCost: true,
        },
      },
      stayOptions: {
        where: {
          isSelected: true,
        },
        select: {
          tripDayId: true,
          pricePerNight: true,
          nights: true,
          totalCost: true,
        },
      },
      mealSuggestions: {
        where: {
          isSelected: true,
        },
        select: {
          tripDayId: true,
          estimatedCost: true,
        },
      },
      activities: {
        where: {
          isSelected: true,
        },
        select: {
          tripDayId: true,
          estimatedCost: true,
        },
      },
    },
  });

  if (!trip) {
    throw new Error("Trip not found while recalculating cost.");
  }

  const dayCosts: DayCostMap = new Map(
    trip.days.map((day) => [day.id, 0])
  );

  let transportCost = 0;
  let stayCost = 0;
  let foodCost = 0;
  let activityCost = 0;
  const miscCost = 0;

  for (const transport of trip.transportOptions) {
    const cost = getTransportCost(transport, trip.peopleCount);

    transportCost = roundMoney(transportCost + cost);
    addDayCost(dayCosts, transport.tripDayId, cost);
  }

  for (const stay of trip.stayOptions) {
    const cost = getStayCost(stay);

    stayCost = roundMoney(stayCost + cost);
    addDayCost(dayCosts, stay.tripDayId, cost);
  }

  for (const meal of trip.mealSuggestions) {
    const cost = roundMoney(getNumberValue(meal.estimatedCost));

    foodCost = roundMoney(foodCost + cost);
    addDayCost(dayCosts, meal.tripDayId, cost);
  }

  for (const activity of trip.activities) {
    const cost = roundMoney(getNumberValue(activity.estimatedCost));

    activityCost = roundMoney(activityCost + cost);
    addDayCost(dayCosts, activity.tripDayId, cost);
  }

  const totalEstimatedCost = roundMoney(
    transportCost + stayCost + foodCost + activityCost + miscCost
  );
  const userBudget = trip.budgetAmount === null ? null : getNumberValue(trip.budgetAmount);
  const budgetStatus = getBudgetStatus(totalEstimatedCost, userBudget);

  await prisma.$transaction([
    ...trip.days.map((day) =>
      prisma.tripDay.update({
        where: {
          id: day.id,
        },
        data: {
          estimatedCost: dayCosts.get(day.id) ?? 0,
        },
      })
    ),
    prisma.tripCostBreakdown.upsert({
      where: {
        tripId,
      },
      create: {
        tripId,
        transportCost,
        stayCost,
        foodCost,
        activityCost,
        miscCost,
        totalEstimatedCost,
        userBudget,
        budgetStatus,
      },
      update: {
        transportCost,
        stayCost,
        foodCost,
        activityCost,
        miscCost,
        totalEstimatedCost,
        userBudget,
        budgetStatus,
      },
    }),
  ]);

  return {
    transportCost,
    stayCost,
    foodCost,
    activityCost,
    miscCost,
    totalEstimatedCost,
    userBudget,
    budgetStatus,
    dayCosts: Object.fromEntries(dayCosts),
  };
}

function getLatestUpdatedAt(dates: Date[]) {
  return dates.reduce<Date | null>((latestDate, date) => {
    if (!latestDate || date > latestDate) {
      return date;
    }

    return latestDate;
  }, null);
}

export async function ensureTripCostBreakdown(tripId: string) {
  const trip = await prisma.trip.findUnique({
    where: {
      id: tripId,
    },
    select: {
      costBreakdown: {
        select: {
          updatedAt: true,
        },
      },
      days: {
        select: {
          updatedAt: true,
        },
      },
      transportOptions: {
        select: {
          updatedAt: true,
        },
      },
      stayOptions: {
        select: {
          updatedAt: true,
        },
      },
      mealSuggestions: {
        select: {
          updatedAt: true,
        },
      },
      activities: {
        select: {
          updatedAt: true,
        },
      },
    },
  });

  if (!trip) return null;

  const latestItineraryUpdate = getLatestUpdatedAt([
    ...trip.days.map((day) => day.updatedAt),
    ...trip.transportOptions.map((transport) => transport.updatedAt),
    ...trip.stayOptions.map((stay) => stay.updatedAt),
    ...trip.mealSuggestions.map((meal) => meal.updatedAt),
    ...trip.activities.map((activity) => activity.updatedAt),
  ]);

  if (!trip.costBreakdown || !latestItineraryUpdate) {
    return recalculateTripCost(tripId);
  }

  if (trip.costBreakdown.updatedAt < latestItineraryUpdate) {
    return recalculateTripCost(tripId);
  }

  return null;
}
