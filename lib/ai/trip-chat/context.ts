import {
  calculateSelectedCostTotals,
  calculateStayCost,
  calculateTransportCost,
  getMoneyNumber,
  getNullableMoneyNumber,
  roundMoney,
} from "@/lib/trips/trip-cost-calculations";

const DEFAULT_OPTION_LIMIT_PER_CATEGORY = 20;
const HIGHEST_COST_ITEM_LIMIT = 6;

type MoneyValue = unknown;

export type TripChatConversationMessage = {
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  proposalStatus: "NONE" | "PENDING" | "APPLIED" | "DISCARDED";
  proposalSummary: string | null;
};

export type TripChatSource = {
  id: string;
  title: string;
  summary: string | null;
  daysCount: number;
  peopleCount: number;
  budgetAmount: MoneyValue;
  currency: string;
  tripType: string;
  travelPace: string;
  foodPreference: string;
  transportPreference: string;
  specialNotes: string | null;
  fromPlace: { formattedName: string; name: string } | null;
  toPlace: { formattedName: string; name: string } | null;
  days: Array<{
    id: string;
    dayNumber: number;
    title: string;
    description: string | null;
    notes: string | null;
    estimatedCost: MoneyValue;
  }>;
  transportOptions: Array<{
    id: string;
    tripDayId: string | null;
    title: string;
    mode: string;
    fromText: string | null;
    toText: string | null;
    description: string | null;
    costType: string;
    pricePerPerson: MoneyValue;
    totalCost: MoneyValue;
    isSelected: boolean;
    notes: string | null;
  }>;
  stayOptions: Array<{
    id: string;
    tripDayId: string | null;
    name: string;
    city: string | null;
    area: string | null;
    stayType: string;
    budgetLevel: string;
    pricePerNight: MoneyValue;
    nights: number | null;
    totalCost: MoneyValue;
    isSelected: boolean;
    bestFor: string | null;
    notes: string | null;
  }>;
  mealSuggestions: Array<{
    id: string;
    tripDayId: string;
    mealType: string;
    title: string;
    locationName: string | null;
    estimatedCost: MoneyValue;
    isSelected: boolean;
    notes: string | null;
  }>;
  activities: Array<{
    id: string;
    tripDayId: string;
    title: string;
    description: string | null;
    locationName: string | null;
    address: string | null;
    startTime: string | null;
    endTime: string | null;
    durationMinutes: number | null;
    category: string;
    estimatedCost: MoneyValue;
    isSelected: boolean;
    notes: string | null;
    position: number;
  }>;
};

type ContextTransport = {
  id: string;
  dayId: string | null;
  dayNumber: number | null;
  title: string;
  mode: string;
  from: string | null;
  to: string | null;
  description: string | null;
  costType: string;
  pricePerPerson: number | null;
  totalCost: number | null;
  calculatedTripCost: number;
  notes: string | null;
  isSelected: boolean;
};

type ContextStay = {
  id: string;
  dayId: string | null;
  dayNumber: number | null;
  name: string;
  city: string | null;
  area: string | null;
  stayType: string;
  budgetLevel: string;
  pricePerNight: number | null;
  nights: number | null;
  totalCost: number | null;
  calculatedTripCost: number;
  bestFor: string | null;
  notes: string | null;
  isSelected: boolean;
};

type ContextMeal = {
  id: string;
  dayId: string;
  dayNumber: number | null;
  mealType: string;
  title: string;
  locationName: string | null;
  estimatedCost: number | null;
  calculatedTripCost: number;
  notes: string | null;
  isSelected: boolean;
};

type ContextActivity = {
  id: string;
  dayId: string;
  dayNumber: number | null;
  title: string;
  description: string | null;
  locationName: string | null;
  address: string | null;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  category: string;
  estimatedCost: number | null;
  calculatedTripCost: number;
  notes: string | null;
  position: number;
  isSelected: boolean;
};

type OptionCategory<T> = {
  totalCount: number;
  includedCount: number;
  omittedCount: number;
  items: T[];
};

export type TripChatContext = {
  contextVersion: 1;
  tripOverview: {
    tripId: string;
    title: string;
    summary: string | null;
    origin: string;
    destination: string;
    tripDays: number;
    travellers: number;
    currency: string;
  };
  preferences: {
    tripType: string;
    travelPace: string;
    foodPreference: string;
    transportPreference: string;
    specialNotes: string | null;
  };
  budgetFacts: {
    configuredBudget: number | null;
    currentEstimatedSelectedTotal: number;
    remainingBudget: number | null;
    exceededBy: number | null;
    percentageUsed: number | null;
    costPerTraveller: number;
    costPerTripDay: number;
    budgetStatus: string;
    categoryTotals: {
      transport: number;
      stays: number;
      meals: number;
      activities: number;
    };
    highestCostSelectedItems: Array<{
      itemType: "transport" | "stay" | "meal" | "activity";
      itemId: string;
      dayId: string | null;
      dayNumber: number | null;
      label: string;
      calculatedTripCost: number;
    }>;
    costSemantics: string[];
  };
  selectedItinerary: {
    meaning: "Items with isSelected=true are part of the final itinerary.";
    days: Array<{
      dayId: string;
      dayNumber: number;
      title: string;
      description: string | null;
      notes: string | null;
      storedEstimatedCost: number | null;
      calculatedSelectedCost: number;
      transports: ContextTransport[];
      stays: ContextStay[];
      meals: ContextMeal[];
      activities: ContextActivity[];
    }>;
    unassigned: {
      transports: ContextTransport[];
      stays: ContextStay[];
    };
  };
  unselectedOptions: {
    meaning: "Items with isSelected=false are options only and are not part of the final itinerary.";
    optionLimitPerCategory: number;
    transports: OptionCategory<ContextTransport>;
    stays: OptionCategory<ContextStay>;
    meals: OptionCategory<ContextMeal>;
    activities: OptionCategory<ContextActivity>;
  };
  recentConversation: TripChatConversationMessage[];
};

function getBudgetStatus(total: number, budget: number | null) {
  if (!budget || budget <= 0 || total <= 0) return "UNKNOWN";

  const ratio = total / budget;
  if (ratio <= 0.8) return "BUDGET_FRIENDLY";
  if (ratio <= 1) return "UNDER_BUDGET";
  if (ratio <= 1.1) return "SLIGHTLY_OVER";
  return "OVER_BUDGET";
}

function boundedOptions<T>(items: T[], limit: number): OptionCategory<T> {
  const includedItems = items.slice(0, limit);

  return {
    totalCount: items.length,
    includedCount: includedItems.length,
    omittedCount: Math.max(items.length - includedItems.length, 0),
    items: includedItems,
  };
}

export function buildTripChatContext({
  trip,
  recentConversation,
  optionLimitPerCategory = DEFAULT_OPTION_LIMIT_PER_CATEGORY,
}: {
  trip: TripChatSource;
  recentConversation: TripChatConversationMessage[];
  optionLimitPerCategory?: number;
}): TripChatContext {
  const dayNumberById = new Map(
    trip.days.map((day) => [day.id, day.dayNumber]),
  );
  const selectedTransports = trip.transportOptions.filter(
    (item) => item.isSelected,
  );
  const selectedStays = trip.stayOptions.filter((item) => item.isSelected);
  const selectedMeals = trip.mealSuggestions.filter((item) => item.isSelected);
  const selectedActivities = trip.activities.filter((item) => item.isSelected);

  const mapTransport = (item: TripChatSource["transportOptions"][number]) => ({
    id: item.id,
    dayId: item.tripDayId,
    dayNumber: item.tripDayId
      ? (dayNumberById.get(item.tripDayId) ?? null)
      : null,
    title: item.title,
    mode: item.mode,
    from: item.fromText,
    to: item.toText,
    description: item.description,
    costType: item.costType,
    pricePerPerson: getNullableMoneyNumber(item.pricePerPerson),
    totalCost: getNullableMoneyNumber(item.totalCost),
    calculatedTripCost: calculateTransportCost(item, trip.peopleCount),
    notes: item.notes,
    isSelected: item.isSelected,
  });
  const mapStay = (item: TripChatSource["stayOptions"][number]) => ({
    id: item.id,
    dayId: item.tripDayId,
    dayNumber: item.tripDayId
      ? (dayNumberById.get(item.tripDayId) ?? null)
      : null,
    name: item.name,
    city: item.city,
    area: item.area,
    stayType: item.stayType,
    budgetLevel: item.budgetLevel,
    pricePerNight: getNullableMoneyNumber(item.pricePerNight),
    nights: item.nights,
    totalCost: getNullableMoneyNumber(item.totalCost),
    calculatedTripCost: calculateStayCost(item),
    bestFor: item.bestFor,
    notes: item.notes,
    isSelected: item.isSelected,
  });
  const mapMeal = (item: TripChatSource["mealSuggestions"][number]) => ({
    id: item.id,
    dayId: item.tripDayId,
    dayNumber: dayNumberById.get(item.tripDayId) ?? null,
    mealType: item.mealType,
    title: item.title,
    locationName: item.locationName,
    estimatedCost: getNullableMoneyNumber(item.estimatedCost),
    calculatedTripCost: roundMoney(getMoneyNumber(item.estimatedCost)),
    notes: item.notes,
    isSelected: item.isSelected,
  });
  const mapActivity = (item: TripChatSource["activities"][number]) => ({
    id: item.id,
    dayId: item.tripDayId,
    dayNumber: dayNumberById.get(item.tripDayId) ?? null,
    title: item.title,
    description: item.description,
    locationName: item.locationName,
    address: item.address,
    startTime: item.startTime,
    endTime: item.endTime,
    durationMinutes: item.durationMinutes,
    category: item.category,
    estimatedCost: getNullableMoneyNumber(item.estimatedCost),
    calculatedTripCost: roundMoney(getMoneyNumber(item.estimatedCost)),
    notes: item.notes,
    position: item.position,
    isSelected: item.isSelected,
  });

  const mappedSelectedTransports = selectedTransports.map(mapTransport);
  const mappedSelectedStays = selectedStays.map(mapStay);
  const mappedSelectedMeals = selectedMeals.map(mapMeal);
  const mappedSelectedActivities = selectedActivities.map(mapActivity);
  const totals = calculateSelectedCostTotals({
    peopleCount: trip.peopleCount,
    transports: selectedTransports,
    stays: selectedStays,
    meals: selectedMeals,
    activities: selectedActivities,
  });
  const configuredBudget = getNullableMoneyNumber(trip.budgetAmount);
  const remainingBudget =
    configuredBudget !== null && totals.total <= configuredBudget
      ? roundMoney(configuredBudget - totals.total)
      : null;
  const exceededBy =
    configuredBudget !== null && totals.total > configuredBudget
      ? roundMoney(totals.total - configuredBudget)
      : null;

  const highestCostSelectedItems = [
    ...mappedSelectedTransports.map((item) => ({
      itemType: "transport" as const,
      itemId: item.id,
      dayId: item.dayId,
      dayNumber: item.dayNumber,
      label: item.title,
      calculatedTripCost: item.calculatedTripCost,
    })),
    ...mappedSelectedStays.map((item) => ({
      itemType: "stay" as const,
      itemId: item.id,
      dayId: item.dayId,
      dayNumber: item.dayNumber,
      label: item.name,
      calculatedTripCost: item.calculatedTripCost,
    })),
    ...mappedSelectedMeals.map((item) => ({
      itemType: "meal" as const,
      itemId: item.id,
      dayId: item.dayId,
      dayNumber: item.dayNumber,
      label: item.title,
      calculatedTripCost: item.calculatedTripCost,
    })),
    ...mappedSelectedActivities.map((item) => ({
      itemType: "activity" as const,
      itemId: item.id,
      dayId: item.dayId,
      dayNumber: item.dayNumber,
      label: item.title,
      calculatedTripCost: item.calculatedTripCost,
    })),
  ]
    .filter((item) => item.calculatedTripCost > 0)
    .sort((left, right) => right.calculatedTripCost - left.calculatedTripCost)
    .slice(0, HIGHEST_COST_ITEM_LIMIT);

  const selectedDays = trip.days.map((day) => {
    const transports = mappedSelectedTransports.filter(
      (item) => item.dayId === day.id,
    );
    const stays = mappedSelectedStays.filter((item) => item.dayId === day.id);
    const meals = mappedSelectedMeals.filter((item) => item.dayId === day.id);
    const activities = mappedSelectedActivities.filter(
      (item) => item.dayId === day.id,
    );

    return {
      dayId: day.id,
      dayNumber: day.dayNumber,
      title: day.title,
      description: day.description,
      notes: day.notes,
      storedEstimatedCost: getNullableMoneyNumber(day.estimatedCost),
      calculatedSelectedCost: roundMoney(
        [...transports, ...stays, ...meals, ...activities].reduce(
          (total, item) => total + item.calculatedTripCost,
          0,
        ),
      ),
      transports,
      stays,
      meals,
      activities,
    };
  });

  return {
    contextVersion: 1,
    tripOverview: {
      tripId: trip.id,
      title: trip.title,
      summary: trip.summary,
      origin:
        trip.fromPlace?.formattedName ?? trip.fromPlace?.name ?? "Not set",
      destination:
        trip.toPlace?.formattedName ?? trip.toPlace?.name ?? "Not set",
      tripDays: trip.daysCount,
      travellers: trip.peopleCount,
      currency: trip.currency,
    },
    preferences: {
      tripType: trip.tripType,
      travelPace: trip.travelPace,
      foodPreference: trip.foodPreference,
      transportPreference: trip.transportPreference,
      specialNotes: trip.specialNotes,
    },
    budgetFacts: {
      configuredBudget,
      currentEstimatedSelectedTotal: totals.total,
      remainingBudget,
      exceededBy,
      percentageUsed:
        configuredBudget && configuredBudget > 0
          ? roundMoney((totals.total / configuredBudget) * 100)
          : null,
      costPerTraveller:
        trip.peopleCount > 0
          ? roundMoney(totals.total / trip.peopleCount)
          : totals.total,
      costPerTripDay:
        trip.daysCount > 0
          ? roundMoney(totals.total / trip.daysCount)
          : totals.total,
      budgetStatus: getBudgetStatus(totals.total, configuredBudget),
      categoryTotals: {
        transport: totals.transport,
        stays: totals.stays,
        meals: totals.meals,
        activities: totals.activities,
      },
      highestCostSelectedItems,
      costSemantics: [
        "PER_PERSON transport is multiplied by traveller count; TOTAL transport uses totalCost.",
        "A positive stay totalCost is used; otherwise pricePerNight is multiplied by nights, with a missing nights value treated as one.",
        "Meal and activity estimatedCost values are treated as whole-trip estimates and are not multiplied by traveller count.",
      ],
    },
    selectedItinerary: {
      meaning: "Items with isSelected=true are part of the final itinerary.",
      days: selectedDays,
      unassigned: {
        transports: mappedSelectedTransports.filter((item) => !item.dayId),
        stays: mappedSelectedStays.filter((item) => !item.dayId),
      },
    },
    unselectedOptions: {
      meaning:
        "Items with isSelected=false are options only and are not part of the final itinerary.",
      optionLimitPerCategory,
      transports: boundedOptions(
        trip.transportOptions
          .filter((item) => !item.isSelected)
          .map(mapTransport),
        optionLimitPerCategory,
      ),
      stays: boundedOptions(
        trip.stayOptions.filter((item) => !item.isSelected).map(mapStay),
        optionLimitPerCategory,
      ),
      meals: boundedOptions(
        trip.mealSuggestions.filter((item) => !item.isSelected).map(mapMeal),
        optionLimitPerCategory,
      ),
      activities: boundedOptions(
        trip.activities.filter((item) => !item.isSelected).map(mapActivity),
        optionLimitPerCategory,
      ),
    },
    recentConversation,
  };
}
