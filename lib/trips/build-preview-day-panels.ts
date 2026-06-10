type PreviewDay = {
  id: string;
  dayNumber: number;
  title: string;
  description: string | null;
};

type TransportOption = {
  id: string;
  tripDayId: string | null;
  title: string;
  mode: string;
  fromText: string | null;
  toText: string | null;
  description: string | null;
  costType: string;
  pricePerPerson: unknown;
  totalCost: unknown;
  isSelected: boolean;
};

type StayOption = {
  id: string;
  tripDayId: string | null;
  name: string;
  city: string | null;
  area: string | null;
  bestFor: string | null;
  pricePerNight: unknown;
  totalCost: unknown;
  isSelected: boolean;
};

type MealSuggestion = {
  id: string;
  tripDayId: string;
  mealType: string;
  title: string;
  locationName: string | null;
  estimatedCost: unknown;
  isSelected: boolean;
  notes: string | null;
};

type TripActivity = {
  id: string;
  tripDayId: string;
  title: string;
  description: string | null;
  locationName: string | null;
  address: string | null;
  startTime: string | null;
  endTime: string | null;
  category: string;
  estimatedCost: unknown;
  isSelected: boolean;
  notes: string | null;
};

export type PreviewRouteItem = {
  id: string;
  title: string;
  description: string;
  location: string;
  type: string;
  tag: string;
  cost: string;
  time: string;
  period: string;
  itemKind: "transport" | "meal" | "activity";
  activityCategory?: string;
};

export type PreviewMealItem = {
  id: string;
  mealTypeLabel: string;
  title: string;
  costLabel: string;
};

export type PreviewStaySummary = {
  name: string;
  description: string;
  costLabel: string;
};

export type PreviewTransportSummary = {
  title: string;
  description: string;
  costLabel: string;
};

export type PreviewDayPanel = {
  dayId: string;
  dayNumber: number;
  tabTitle: string;
  displayTitle: string;
  description: string | null;
  routePreviewItems: PreviewRouteItem[];
  meals: PreviewMealItem[];
  suggestedStay: PreviewStaySummary | null;
  suggestedTransport: PreviewTransportSummary | null;
};

type BuildPreviewDayPanelsInput = {
  days: PreviewDay[];
  transportOptions: TransportOption[];
  stayOptions: StayOption[];
  mealSuggestions: MealSuggestion[];
  activities: TripActivity[];
  formatCurrency: (amount: unknown) => string;
  formatEnumLabel: (value: string) => string;
  getDisplayDayTitle: (day?: PreviewDay) => string;
};

function getFallbackTime(index: number) {
  const times = [
    { time: "09:00", period: "Morning" },
    { time: "11:00", period: "Late Morning" },
    { time: "14:00", period: "Afternoon" },
    { time: "17:30", period: "Evening" },
    { time: "20:00", period: "Night" },
  ];

  return (
    times[index] ?? {
      time: `${9 + index}:00`,
      period: "Day Stop",
    }
  );
}

export function buildPreviewDayPanels({
  days,
  transportOptions,
  stayOptions,
  mealSuggestions,
  activities,
  formatCurrency,
  formatEnumLabel,
  getDisplayDayTitle,
}: BuildPreviewDayPanelsInput): PreviewDayPanel[] {
  const selectedTransportOptions = transportOptions.filter(
    (transport) => transport.isSelected
  );
  const selectedStayOptions = stayOptions.filter((stay) => stay.isSelected);
  const selectedMealSuggestions = mealSuggestions.filter(
    (meal) => meal.isSelected
  );
  const selectedActivities = activities.filter(
    (activity) => activity.isSelected
  );

  return days.map((day) => {
    const selectedDayTransport = selectedTransportOptions.filter(
      (transport) => transport.tripDayId === day.id
    );
    const selectedDayStays = selectedStayOptions.filter(
      (stay) => stay.tripDayId === day.id
    );
    const selectedDayMeals = selectedMealSuggestions.filter(
      (meal) => meal.tripDayId === day.id
    );
    const selectedDayActivities = selectedActivities.filter(
      (activity) => activity.tripDayId === day.id
    );

    const earlyMeals = selectedDayMeals.filter((meal) =>
      ["BREAKFAST", "LUNCH"].includes(meal.mealType)
    );
    const lateMeals = selectedDayMeals.filter((meal) =>
      ["DINNER", "SNACK", "OTHER"].includes(meal.mealType)
    );

    const rawRouteItems = [
      ...selectedDayTransport.map((transport) => ({
        id: `transport-${transport.id}`,
        title: transport.title,
        description:
          transport.description ||
          `${transport.fromText || "Start"} → ${transport.toText || "End"}`,
        location: [transport.fromText, transport.toText]
          .filter(Boolean)
          .join(" → "),
        type: formatEnumLabel(transport.mode),
        tag: "Selected transport",
        cost:
          transport.costType === "PER_PERSON"
            ? transport.pricePerPerson
              ? `${formatCurrency(transport.pricePerPerson)}/person`
              : "Cost not set"
            : transport.totalCost
              ? formatCurrency(transport.totalCost)
              : "Cost not set",
        customTime: null as string | null,
        itemKind: "transport" as const,
        activityCategory: undefined as string | undefined,
      })),
      ...earlyMeals.map((meal) => ({
        id: `meal-${meal.id}`,
        title: meal.title,
        description: meal.notes || "Meal added to this day.",
        location: meal.locationName || "Food stop",
        type: formatEnumLabel(meal.mealType),
        tag: "Food break",
        cost: meal.estimatedCost
          ? formatCurrency(meal.estimatedCost)
          : "Cost not set",
        customTime: null as string | null,
        itemKind: "meal" as const,
        activityCategory: undefined as string | undefined,
      })),
      ...selectedDayActivities.map((activity) => ({
        id: `activity-${activity.id}`,
        title: activity.title,
        description:
          activity.description ||
          activity.notes ||
          "Activity added to this day.",
        location:
          activity.locationName || activity.address || "Activity location",
        type: formatEnumLabel(activity.category),
        tag:
          activity.category === "HIDDEN_SPOT"
            ? "Hidden spot"
            : activity.endTime
              ? `${activity.startTime || "Start"} → ${activity.endTime}`
              : "Activity",
        cost: activity.estimatedCost
          ? formatCurrency(activity.estimatedCost)
          : "Cost not set",
        customTime: activity.startTime,
        itemKind: "activity" as const,
        activityCategory: activity.category,
      })),
      ...lateMeals.map((meal) => ({
        id: `meal-${meal.id}`,
        title: meal.title,
        description: meal.notes || "Meal added to this day.",
        location: meal.locationName || "Food stop",
        type: formatEnumLabel(meal.mealType),
        tag: "Food break",
        cost: meal.estimatedCost
          ? formatCurrency(meal.estimatedCost)
          : "Cost not set",
        customTime: null as string | null,
        itemKind: "meal" as const,
        activityCategory: undefined as string | undefined,
      })),
    ];

    const routePreviewItems: PreviewRouteItem[] = rawRouteItems.map(
      (item, index) => {
        const fallback = getFallbackTime(index);

        return {
          id: item.id,
          title: item.title,
          description: item.description,
          location: item.location,
          type: item.type,
          tag: item.tag,
          cost: item.cost,
          time: item.customTime || fallback.time,
          period: fallback.period,
          itemKind: item.itemKind,
          activityCategory: item.activityCategory,
        };
      }
    );

    const suggestedStayOption =
      selectedDayStays[0] ?? selectedStayOptions[0] ?? null;
    const suggestedTransportOption =
      selectedDayTransport[0] ?? selectedTransportOptions[0] ?? null;

    const suggestedStay = suggestedStayOption
      ? {
          name: suggestedStayOption.name,
          description:
            suggestedStayOption.bestFor ||
            [suggestedStayOption.area, suggestedStayOption.city]
              .filter(Boolean)
              .join(", ") ||
            "No stay selected yet.",
          costLabel: suggestedStayOption.totalCost
            ? formatCurrency(suggestedStayOption.totalCost)
            : suggestedStayOption.pricePerNight
              ? `${formatCurrency(suggestedStayOption.pricePerNight)}/night`
              : "Cost not set",
        }
      : null;

    const suggestedTransport = suggestedTransportOption
      ? {
          title: suggestedTransportOption.title,
          description:
            suggestedTransportOption.description ||
            [suggestedTransportOption.fromText, suggestedTransportOption.toText]
              .filter(Boolean)
              .join(" → ") ||
            "No transport selected yet.",
          costLabel:
            suggestedTransportOption.costType === "PER_PERSON"
              ? suggestedTransportOption.pricePerPerson
                ? `${formatCurrency(
                    suggestedTransportOption.pricePerPerson
                  )}/person`
                : "Cost not set"
              : suggestedTransportOption.totalCost
                ? formatCurrency(suggestedTransportOption.totalCost)
                : "Cost not set",
        }
      : null;

    const defaultTitle = `Day ${day.dayNumber}`;
    const tabTitle =
      !day.title || day.title.trim() === defaultTitle ? "" : day.title.trim();

    return {
      dayId: day.id,
      dayNumber: day.dayNumber,
      tabTitle,
      displayTitle: getDisplayDayTitle(day),
      description: day.description,
      routePreviewItems,
      meals: selectedDayMeals.slice(0, 4).map((meal) => ({
        id: meal.id,
        mealTypeLabel: formatEnumLabel(meal.mealType),
        title: meal.title,
        costLabel: meal.estimatedCost
          ? formatCurrency(meal.estimatedCost)
          : "Not set",
      })),
      suggestedStay,
      suggestedTransport,
    };
  });
}
