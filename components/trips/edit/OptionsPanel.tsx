"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  Edit3,
  Hotel,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Route,
  Sparkles,
  Trash2,
  Utensils,
} from "lucide-react";

import {
  deleteTransportOptionAction,
  selectTransportOptionAction,
  updateTransportOptionAction,
} from "@/actions/trips/trip-transport.action";
import {
  deleteStayOptionAction,
  selectStayOptionAction,
  updateStayOptionAction,
} from "@/actions/trips/trip-stay.action";
import {
  deleteMealSuggestionAction,
  selectMealSuggestionAction,
  updateMealSuggestionAction,
} from "@/actions/trips/trip-meal.action";
import {
  deleteTripActivityAction,
  selectTripActivityAction,
  updateTripActivityAction,
} from "@/actions/trips/trip-activity.action";
import { useConfirmStore } from "@/stores/use-confirm-store";
import ItemActionsMenu from "@/components/trips/edit/ItemActionsMenu";
import TransportModal, {
  type TransportFormValues,
  type TransportOption,
} from "@/components/trips/edit/modals/TransportModal";
import StayModal, {
  type StayFormValues,
  type StayOption,
} from "@/components/trips/edit/modals/StayModal";
import MealModal, {
  type MealFormValues,
  type MealSuggestion,
} from "@/components/trips/edit/modals/MealModal";
import ActivityModal, {
  type ActivityFormValues,
  type TripActivity,
} from "@/components/trips/edit/modals/ActivityModal";

type TripDay = {
  id: string;
  dayNumber: number;
};

type SelectableMealSuggestion = MealSuggestion & {
  isSelected: boolean;
};

type SelectableTripActivity = TripActivity & {
  isSelected: boolean;
};

type OptionsPanelContentProps = {
  tripId: string;
  days: TripDay[];
  transportOptions: TransportOption[];
  stayOptions: StayOption[];
  mealSuggestions: SelectableMealSuggestion[];
  activities: SelectableTripActivity[];
};

type OptionsPanelProps = OptionsPanelContentProps & {
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
};

type OptionsSummaryInput = Pick<
  OptionsPanelContentProps,
  "transportOptions" | "stayOptions" | "mealSuggestions" | "activities"
>;

type OptionsSummary = {
  transports: number;
  stays: number;
  meals: number;
  activities: number;
  total: number;
};

type OptionPendingAction = "move" | "delete";

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function formatMoney(value: string | null) {
  const amount = Number(value);

  if (!value || Number.isNaN(amount)) return "Cost not set";

  return `INR ${amount.toLocaleString("en-IN")}`;
}

function getDayLabel(days: TripDay[], tripDayId: string | null) {
  if (!tripDayId) return "No day assigned";

  const day = days.find((item) => item.id === tripDayId);

  return day ? `Day ${day.dayNumber}` : "Day not found";
}

function getFirstDayId(days: TripDay[]) {
  return days[0]?.id ?? null;
}

function getFirstDayNumber(days: TripDay[]) {
  return days[0]?.dayNumber;
}

function getItemDayNumber(days: TripDay[], tripDayId: string | null) {
  if (!tripDayId) return getFirstDayNumber(days);

  return days.find((day) => day.id === tripDayId)?.dayNumber;
}

function getOptionsSummary({
  transportOptions,
  stayOptions,
  mealSuggestions,
  activities,
}: OptionsSummaryInput): OptionsSummary {
  const transports = transportOptions.filter(
    (option) => !option.isSelected,
  ).length;
  const stays = stayOptions.filter((option) => !option.isSelected).length;
  const meals = mealSuggestions.filter((meal) => !meal.isSelected).length;
  const activitiesCount = activities.filter(
    (activity) => !activity.isSelected,
  ).length;

  return {
    transports,
    stays,
    meals,
    activities: activitiesCount,
    total: transports + stays + meals + activitiesCount,
  };
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card-secondary/40 p-4 text-sm font-bold leading-6 text-secondary-foreground">
      No saved options yet. AI suggestions will appear here later.
    </div>
  );
}

function GroupHeader({
  icon,
  title,
  count,
}: {
  icon: ReactNode;
  title: string;
  count: number;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        {icon}

        <h3 className="truncate text-xs font-black uppercase tracking-[0.16em] text-secondary-foreground">
          {title}
        </h3>
      </div>

      <span className="shrink-0 rounded-full bg-card-secondary px-2 py-0.5 text-[10px] font-black text-primary">
        {count}
      </span>
    </div>
  );
}

function AddToPlanButton({
  label,
  isPending,
  onClick,
}: {
  label: string;
  isPending: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={isPending}
      onClick={onClick}
      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
    </button>
  );
}

function OptionCard({
  title,
  subtitle,
  price,
  isPending,
  pendingAction,
  children,
}: {
  title: string;
  subtitle: string;
  price: string;
  isPending: boolean;
  pendingAction?: OptionPendingAction;
  children: ReactNode;
}) {
  return (
    <div className="relative overflow-visible rounded-2xl border border-border/70 bg-card-secondary/35 p-2.5 transition hover:bg-card">
      <div
        className={`flex items-start justify-between gap-3 transition ${
          isPending ? "scale-[0.985] opacity-45 blur-[1px]" : ""
        }`}
      >
        <div className="min-w-0">
          <p className="wrap-break-word text-[13px] font-black text-foreground">
            {title}
          </p>

          <p className="mt-0.5 line-clamp-1 text-[11px] font-semibold text-secondary-foreground">
            {subtitle}
          </p>

          <p className="mt-2 text-[11px] font-black text-primary">{price}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">{children}</div>
      </div>

      {isPending ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-card/80 backdrop-blur-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card-secondary px-3 py-1.5 text-[11px] font-black text-foreground shadow-sm">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            {pendingAction === "delete" ? "Deleting option..." : "Moving..."}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AnimatedOptionWrapper({
  id,
  pendingAction,
  children,
}: {
  id: string;
  pendingAction?: OptionPendingAction;
  children: ReactNode;
}) {
  return (
    <motion.div
      layout
      key={id}
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        x: pendingAction === "delete" ? -28 : 28,
        scale: 0.96,
        filter: "blur(2px)",
      }}
      transition={{
        duration: 0.22,
        ease: "easeOut",
        layout: {
          duration: 0.22,
          ease: "easeOut",
        },
      }}
      className="overflow-visible"
    >
      {children}
    </motion.div>
  );
}

function OptionsPanelContent({
  tripId,
  days,
  transportOptions,
  stayOptions,
  mealSuggestions,
  activities,
}: OptionsPanelContentProps) {
  const router = useRouter();
  const confirm = useConfirmStore((state) => state.confirm);
  const [isPending, startTransition] = useTransition();

  const [message, setMessage] = useState("");
  const [transportModalError, setTransportModalError] = useState("");
  const [stayModalError, setStayModalError] = useState("");
  const [mealModalError, setMealModalError] = useState("");
  const [activityModalError, setActivityModalError] = useState("");

  const [editingTransport, setEditingTransport] =
    useState<TransportOption | null>(null);
  const [editingStay, setEditingStay] = useState<StayOption | null>(null);
  const [editingMeal, setEditingMeal] =
    useState<SelectableMealSuggestion | null>(null);
  const [editingActivity, setEditingActivity] =
    useState<SelectableTripActivity | null>(null);

  const [hiddenOptionIds, setHiddenOptionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [pendingOptionActions, setPendingOptionActions] = useState<
    Record<string, OptionPendingAction>
  >({});

  useEffect(() => {
    if (!message) return;

    const clearTimer = window.setTimeout(() => {
      setMessage("");
    }, 5000);

    return () => window.clearTimeout(clearTimer);
  }, [message]);

  const visibleOptionIds = new Set([
    ...transportOptions
      .filter((option) => !option.isSelected)
      .map((option) => option.id),
    ...stayOptions
      .filter((option) => !option.isSelected)
      .map((option) => option.id),
    ...mealSuggestions
      .filter((meal) => !meal.isSelected)
      .map((meal) => meal.id),
    ...activities
      .filter((activity) => !activity.isSelected)
      .map((activity) => activity.id),
  ]);

  const visibleHiddenOptionIds = new Set(
    [...hiddenOptionIds].filter((id) => !visibleOptionIds.has(id)),
  );

  function isOptionHidden(id: string) {
    return visibleHiddenOptionIds.has(id);
  }

  function getPendingAction(id: string) {
    return pendingOptionActions[id];
  }

  function setPendingAction(id: string, action: OptionPendingAction) {
    setPendingOptionActions((currentActions) => ({
      ...currentActions,
      [id]: action,
    }));
  }

  function clearPendingAction(id: string) {
    setPendingOptionActions((currentActions) => {
      const nextActions = { ...currentActions };
      delete nextActions[id];
      return nextActions;
    });
  }

  async function runAnimatedOptionAction({
    id,
    actionType,
    action,
  }: {
    id: string;
    actionType: OptionPendingAction;
    action: () => Promise<boolean>;
  }) {
    if (pendingOptionActions[id]) return;

    setPendingAction(id, actionType);

    const success = await action();

    if (!success) {
      clearPendingAction(id);
      return;
    }

    setHiddenOptionIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(id);
      return nextIds;
    });

    await wait(230);

    router.refresh();
    clearPendingAction(id);
  }

  const unselectedTransports = transportOptions.filter(
    (option) => !option.isSelected && !isOptionHidden(option.id),
  );
  const unselectedStays = stayOptions.filter(
    (option) => !option.isSelected && !isOptionHidden(option.id),
  );
  const unselectedMeals = mealSuggestions.filter(
    (meal) => !meal.isSelected && !isOptionHidden(meal.id),
  );
  const unselectedActivities = activities.filter(
    (activity) => !activity.isSelected && !isOptionHidden(activity.id),
  );

  const summary = {
    transports: unselectedTransports.length,
    stays: unselectedStays.length,
    meals: unselectedMeals.length,
    activities: unselectedActivities.length,
    total:
      unselectedTransports.length +
      unselectedStays.length +
      unselectedMeals.length +
      unselectedActivities.length,
  };

  const hasOptions = summary.total > 0;

  async function selectTransport(option: TransportOption) {
    const tripDayId = option.tripDayId ?? getFirstDayId(days);

    if (!tripDayId) {
      setMessage("Add a day before moving this transport into the plan.");
      return false;
    }

    setMessage("");

    const result = await selectTransportOptionAction({
      tripId,
      transportOptionId: option.id,
      tripDayId,
    });

    setMessage(result.message);

    return result.success;
  }

  async function selectStay(option: StayOption) {
    const tripDayId = option.tripDayId ?? getFirstDayId(days);

    if (!tripDayId) {
      setMessage("Add a day before moving this stay into the plan.");
      return false;
    }

    setMessage("");

    const result = await selectStayOptionAction({
      tripId,
      stayOptionId: option.id,
      tripDayId,
    });

    setMessage(result.message);

    return result.success;
  }

  async function selectMeal(meal: SelectableMealSuggestion) {
    setMessage("");

    const result = await selectMealSuggestionAction({
      tripId,
      mealSuggestionId: meal.id,
    });

    setMessage(result.message);

    return result.success;
  }

  async function selectActivity(activity: SelectableTripActivity) {
    setMessage("");

    const result = await selectTripActivityAction({
      tripId,
      activityId: activity.id,
    });

    setMessage(result.message);

    return result.success;
  }

  async function deleteTransport(option: TransportOption) {
    const confirmed = await confirm({
      title: "Delete transport option?",
      description:
        "This option will be permanently removed. Moving it to the plan is different from deleting it.",
      confirmText: "Delete transport",
      cancelText: "Keep option",
      variant: "danger",
    });

    if (!confirmed) return false;

    setMessage("");

    const result = await deleteTransportOptionAction({
      tripId,
      transportOptionId: option.id,
    });

    setMessage(result.message);

    return result.success;
  }

  async function deleteStay(option: StayOption) {
    const confirmed = await confirm({
      title: "Delete stay option?",
      description:
        "This option will be permanently removed. Moving it to the plan is different from deleting it.",
      confirmText: "Delete stay",
      cancelText: "Keep option",
      variant: "danger",
    });

    if (!confirmed) return false;

    setMessage("");

    const result = await deleteStayOptionAction({
      tripId,
      stayOptionId: option.id,
    });

    setMessage(result.message);

    return result.success;
  }

  async function deleteMeal(meal: SelectableMealSuggestion) {
    const confirmed = await confirm({
      title: "Delete meal option?",
      description:
        "This meal option will be permanently removed from the trip.",
      confirmText: "Delete meal",
      cancelText: "Keep option",
      variant: "danger",
    });

    if (!confirmed) return false;

    setMessage("");

    const result = await deleteMealSuggestionAction({
      tripId,
      mealSuggestionId: meal.id,
    });

    setMessage(result.message);

    return result.success;
  }

  async function deleteActivity(activity: SelectableTripActivity) {
    const confirmed = await confirm({
      title: "Delete activity option?",
      description:
        "This activity option will be permanently removed from the trip.",
      confirmText: "Delete activity",
      cancelText: "Keep option",
      variant: "danger",
    });

    if (!confirmed) return false;

    setMessage("");

    const result = await deleteTripActivityAction({
      tripId,
      activityId: activity.id,
    });

    setMessage(result.message);

    return result.success;
  }

  function handleSaveTransport(values: TransportFormValues) {
    if (!editingTransport) return;

    setTransportModalError("");
    setMessage("");

    startTransition(async () => {
      const result = await updateTransportOptionAction({
        tripId,
        transportOptionId: editingTransport.id,
        tripDayId: editingTransport.tripDayId,
        title: values.title,
        mode: values.mode as
          | "FLIGHT"
          | "TRAIN"
          | "BUS"
          | "CAB"
          | "SELF_DRIVE"
          | "WALK"
          | "BIKE"
          | "FERRY"
          | "METRO"
          | "MIXED"
          | "OTHER",
        fromText: values.fromText,
        toText: values.toText,
        description: values.description,
        costType: values.costType as "PER_PERSON" | "TOTAL",
        pricePerPerson: values.pricePerPerson,
        totalCost: values.totalCost,
        notes: values.notes,
        isSelected: false,
      });

      if (!result.success) {
        setTransportModalError(result.message);
        return;
      }

      setMessage(result.message);
      setEditingTransport(null);
      router.refresh();
    });
  }

  function handleSaveStay(values: StayFormValues) {
    if (!editingStay) return;

    setStayModalError("");
    setMessage("");

    startTransition(async () => {
      const result = await updateStayOptionAction({
        tripId,
        stayOptionId: editingStay.id,
        tripDayId: editingStay.tripDayId,
        name: values.name,
        city: values.city,
        area: values.area,
        stayType: values.stayType as
          | "HOTEL"
          | "RESORT"
          | "HOMESTAY"
          | "HOUSEBOAT"
          | "HOSTEL"
          | "VILLA"
          | "CAMP"
          | "GUEST_HOUSE"
          | "OTHER",
        budgetLevel: values.budgetLevel as
          "BUDGET" | "MID_RANGE" | "PREMIUM" | "LUXURY",
        pricePerNight: values.pricePerNight,
        nights: values.nights,
        totalCost: values.totalCost,
        bestFor: values.bestFor,
        notes: values.notes,
        isSelected: false,
      });

      if (!result.success) {
        setStayModalError(result.message);
        return;
      }

      setMessage(result.message);
      setEditingStay(null);
      router.refresh();
    });
  }

  function handleSaveMeal(values: MealFormValues) {
    if (!editingMeal) return;

    setMealModalError("");
    setMessage("");

    startTransition(async () => {
      const result = await updateMealSuggestionAction({
        tripId,
        mealSuggestionId: editingMeal.id,
        tripDayId: editingMeal.tripDayId,
        mealType: values.mealType as
          "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "OTHER",
        title: values.title,
        locationName: values.locationName,
        estimatedCost: values.estimatedCost,
        notes: values.notes,
      });

      if (!result.success) {
        setMealModalError(result.message);
        return;
      }

      setMessage(result.message);
      setEditingMeal(null);
      router.refresh();
    });
  }

  function handleSaveActivity(values: ActivityFormValues) {
    if (!editingActivity) return;

    setActivityModalError("");
    setMessage("");

    startTransition(async () => {
      const result = await updateTripActivityAction({
        tripId,
        activityId: editingActivity.id,
        tripDayId: editingActivity.tripDayId,
        title: values.title,
        description: values.description,
        locationName: values.locationName,
        address: values.address,
        startTime: values.startTime,
        endTime: values.endTime,
        durationMinutes: values.durationMinutes,
        category: values.category as
          | "SIGHTSEEING"
          | "ADVENTURE"
          | "FOOD"
          | "SHOPPING"
          | "RELAXATION"
          | "CULTURE"
          | "RELIGIOUS"
          | "NATURE"
          | "TRANSPORT_BREAK"
          | "HIDDEN_SPOT"
          | "OTHER",
        estimatedCost: values.estimatedCost,
        notes: values.notes,
        position: editingActivity.position,
      });

      if (!result.success) {
        setActivityModalError(result.message);
        return;
      }

      setMessage(result.message);
      setEditingActivity(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="space-y-4">
        {message ? (
          <div className="rounded-2xl border border-border bg-card-secondary px-3 py-2 text-xs font-bold text-secondary-foreground">
            {message}
          </div>
        ) : null}

        {!hasOptions ? <EmptyState /> : null}

        {unselectedTransports.length > 0 ? (
          <div>
            <GroupHeader
              icon={<Route className="h-4 w-4 text-primary" />}
              title="Transport options"
              count={unselectedTransports.length}
            />

            <div className="space-y-2">
              <AnimatePresence initial={false} mode="popLayout">
                {unselectedTransports.map((option) => {
                  const pendingAction = getPendingAction(option.id);
                  const isCardPending = Boolean(pendingAction);

                  return (
                    <AnimatedOptionWrapper
                      key={option.id}
                      id={option.id}
                      pendingAction={pendingAction}
                    >
                      <OptionCard
                        title={option.title}
                        subtitle={`${option.mode.replace("_", " ")} - ${getDayLabel(
                          days,
                          option.tripDayId,
                        )}`}
                        price={formatMoney(
                          option.totalCost ?? option.pricePerPerson,
                        )}
                        isPending={isCardPending}
                        pendingAction={pendingAction}
                      >
                        <AddToPlanButton
                          label="Add transport to plan"
                          isPending={pendingAction === "move"}
                          onClick={() =>
                            runAnimatedOptionAction({
                              id: option.id,
                              actionType: "move",
                              action: () => selectTransport(option),
                            })
                          }
                        />

                        <ItemActionsMenu
                          actions={[
                            {
                              label: "Edit",
                              icon: <Edit3 className="h-3.5 w-3.5" />,
                              onClick: () => {
                                setTransportModalError("");
                                setEditingTransport(option);
                              },
                            },
                            {
                              label: "Delete",
                              icon: <Trash2 className="h-3.5 w-3.5" />,
                              variant: "danger",
                              onClick: () =>
                                runAnimatedOptionAction({
                                  id: option.id,
                                  actionType: "delete",
                                  action: () => deleteTransport(option),
                                }),
                            },
                          ]}
                        />
                      </OptionCard>
                    </AnimatedOptionWrapper>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ) : null}

        {unselectedStays.length > 0 ? (
          <div>
            <GroupHeader
              icon={<Hotel className="h-4 w-4 text-primary" />}
              title="Stay options"
              count={unselectedStays.length}
            />

            <div className="space-y-2">
              <AnimatePresence initial={false} mode="popLayout">
                {unselectedStays.map((option) => {
                  const pendingAction = getPendingAction(option.id);
                  const isCardPending = Boolean(pendingAction);

                  return (
                    <AnimatedOptionWrapper
                      key={option.id}
                      id={option.id}
                      pendingAction={pendingAction}
                    >
                      <OptionCard
                        title={option.name}
                        subtitle={`${option.stayType.replace("_", " ")} - ${
                          option.city ?? getDayLabel(days, option.tripDayId)
                        }`}
                        price={formatMoney(
                          option.totalCost ?? option.pricePerNight,
                        )}
                        isPending={isCardPending}
                        pendingAction={pendingAction}
                      >
                        <AddToPlanButton
                          label="Add stay to plan"
                          isPending={pendingAction === "move"}
                          onClick={() =>
                            runAnimatedOptionAction({
                              id: option.id,
                              actionType: "move",
                              action: () => selectStay(option),
                            })
                          }
                        />

                        <ItemActionsMenu
                          actions={[
                            {
                              label: "Edit",
                              icon: <Edit3 className="h-3.5 w-3.5" />,
                              onClick: () => {
                                setStayModalError("");
                                setEditingStay(option);
                              },
                            },
                            {
                              label: "Delete",
                              icon: <Trash2 className="h-3.5 w-3.5" />,
                              variant: "danger",
                              onClick: () =>
                                runAnimatedOptionAction({
                                  id: option.id,
                                  actionType: "delete",
                                  action: () => deleteStay(option),
                                }),
                            },
                          ]}
                        />
                      </OptionCard>
                    </AnimatedOptionWrapper>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ) : null}

        {unselectedMeals.length > 0 ? (
          <div>
            <GroupHeader
              icon={<Utensils className="h-4 w-4 text-primary" />}
              title="Meal options"
              count={unselectedMeals.length}
            />

            <div className="space-y-2">
              <AnimatePresence initial={false} mode="popLayout">
                {unselectedMeals.map((meal) => {
                  const pendingAction = getPendingAction(meal.id);
                  const isCardPending = Boolean(pendingAction);

                  return (
                    <AnimatedOptionWrapper
                      key={meal.id}
                      id={meal.id}
                      pendingAction={pendingAction}
                    >
                      <OptionCard
                        title={meal.title}
                        subtitle={`${meal.mealType.replace("_", " ")} - ${
                          meal.locationName ?? getDayLabel(days, meal.tripDayId)
                        }`}
                        price={formatMoney(meal.estimatedCost)}
                        isPending={isCardPending}
                        pendingAction={pendingAction}
                      >
                        <AddToPlanButton
                          label="Add meal to plan"
                          isPending={pendingAction === "move"}
                          onClick={() =>
                            runAnimatedOptionAction({
                              id: meal.id,
                              actionType: "move",
                              action: () => selectMeal(meal),
                            })
                          }
                        />

                        <ItemActionsMenu
                          actions={[
                            {
                              label: "Edit",
                              icon: <Edit3 className="h-3.5 w-3.5" />,
                              onClick: () => {
                                setMealModalError("");
                                setEditingMeal(meal);
                              },
                            },
                            {
                              label: "Delete",
                              icon: <Trash2 className="h-3.5 w-3.5" />,
                              variant: "danger",
                              onClick: () =>
                                runAnimatedOptionAction({
                                  id: meal.id,
                                  actionType: "delete",
                                  action: () => deleteMeal(meal),
                                }),
                            },
                          ]}
                        />
                      </OptionCard>
                    </AnimatedOptionWrapper>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ) : null}

        {unselectedActivities.length > 0 ? (
          <div>
            <GroupHeader
              icon={<Sparkles className="h-4 w-4 text-primary" />}
              title="Activity options"
              count={unselectedActivities.length}
            />

            <div className="space-y-2">
              <AnimatePresence initial={false} mode="popLayout">
                {unselectedActivities.map((activity) => {
                  const pendingAction = getPendingAction(activity.id);
                  const isCardPending = Boolean(pendingAction);

                  return (
                    <AnimatedOptionWrapper
                      key={activity.id}
                      id={activity.id}
                      pendingAction={pendingAction}
                    >
                      <OptionCard
                        title={activity.title}
                        subtitle={`${activity.category.replace("_", " ")} - ${
                          activity.locationName ??
                          getDayLabel(days, activity.tripDayId)
                        }`}
                        price={formatMoney(activity.estimatedCost)}
                        isPending={isCardPending}
                        pendingAction={pendingAction}
                      >
                        <AddToPlanButton
                          label="Add activity to plan"
                          isPending={pendingAction === "move"}
                          onClick={() =>
                            runAnimatedOptionAction({
                              id: activity.id,
                              actionType: "move",
                              action: () => selectActivity(activity),
                            })
                          }
                        />

                        <ItemActionsMenu
                          actions={[
                            {
                              label: "Edit",
                              icon: <Edit3 className="h-3.5 w-3.5" />,
                              onClick: () => {
                                setActivityModalError("");
                                setEditingActivity(activity);
                              },
                            },
                            {
                              label: "Delete",
                              icon: <Trash2 className="h-3.5 w-3.5" />,
                              variant: "danger",
                              onClick: () =>
                                runAnimatedOptionAction({
                                  id: activity.id,
                                  actionType: "delete",
                                  action: () => deleteActivity(activity),
                                }),
                            },
                          ]}
                        />
                      </OptionCard>
                    </AnimatedOptionWrapper>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ) : null}
      </div>

      {editingTransport ? (
        <TransportModal
          isOpen={Boolean(editingTransport)}
          isPending={isPending}
          error={transportModalError}
          editingTransport={editingTransport}
          selectedDayNumber={getItemDayNumber(days, editingTransport.tripDayId)}
          onClose={() => {
            setTransportModalError("");
            setEditingTransport(null);
          }}
          onSave={handleSaveTransport}
        />
      ) : null}

      {editingStay ? (
        <StayModal
          isOpen={Boolean(editingStay)}
          isPending={isPending}
          error={stayModalError}
          editingStay={editingStay}
          selectedDayNumber={getItemDayNumber(days, editingStay.tripDayId)}
          onClose={() => {
            setStayModalError("");
            setEditingStay(null);
          }}
          onSave={handleSaveStay}
        />
      ) : null}

      {editingMeal ? (
        <MealModal
          isOpen={Boolean(editingMeal)}
          isPending={isPending}
          error={mealModalError}
          editingMeal={editingMeal}
          selectedDayNumber={getItemDayNumber(days, editingMeal.tripDayId)}
          onClose={() => {
            setMealModalError("");
            setEditingMeal(null);
          }}
          onSave={handleSaveMeal}
        />
      ) : null}

      {editingActivity ? (
        <ActivityModal
          isOpen={Boolean(editingActivity)}
          isPending={isPending}
          error={activityModalError}
          editingActivity={editingActivity}
          selectedDayNumber={getItemDayNumber(days, editingActivity.tripDayId)}
          onClose={() => {
            setActivityModalError("");
            setEditingActivity(null);
          }}
          onSave={handleSaveActivity}
        />
      ) : null}
    </>
  );
}

export default function OptionsPanel({
  isCollapsed = false,
  onToggleCollapsed,
  ...props
}: OptionsPanelProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const summary = getOptionsSummary(props);

  function handleScroll() {
    const element = scrollRef.current;

    if (!element) return;

    const distanceFromTop = element.scrollTop;
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;

    setIsAtTop(distanceFromTop < 8);
    setIsAtBottom(distanceFromBottom < 8);
  }

  if (isCollapsed) {
    return (
      <section className="flex h-full min-h-0 w-13 flex-col items-stretch overflow-hidden rounded-[22px] border border-border bg-card/95 px-1 py-2 shadow-sm">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="group flex h-full cursor-pointer flex-col items-center justify-between rounded-[18px] px-1 py-2.5 transition"
          aria-label="Open options panel"
          title="Open options panel"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card-secondary text-primary shadow-sm transition group-hover:text-primary-hover">
            <PanelLeftOpen className="h-4 w-4" />
          </span>

          <div className="flex items-center justify-center gap-1.5 [writing-mode:vertical-rl]">
            <Sparkles className="h-3.5 w-3.5 rotate-180 text-primary transition group-hover:text-primary-hover" />

            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">
              Options
            </span>
          </div>

          <span className="rounded-full bg-card-secondary px-2 py-1 text-[10px] font-black text-secondary-foreground shadow-sm">
            {summary.total}
          </span>
        </button>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[26px] border border-border bg-card shadow-sm">
      <div className="shrink-0 border-b border-border bg-card-secondary/50 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />

            <div className="min-w-0">
              <h2 className="text-sm font-black text-foreground">
                Options Panel
              </h2>

              <p className="text-xs font-semibold leading-4 text-secondary-foreground">
                Saved suggestions waiting outside the final plan
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-card px-2.5 py-1 text-[10px] font-black text-secondary-foreground">
              {summary.total} saved
            </span>

            {onToggleCollapsed ? (
              <button
                type="button"
                onClick={onToggleCollapsed}
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-secondary-foreground transition hover:bg-dashboard hover:text-foreground"
                aria-label="Collapse options panel"
                title="Collapse options panel"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto p-3 scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          <OptionsPanelContent {...props} />
        </div>

        {!isAtTop ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-linear-to-b from-card via-card/80 to-transparent" />
        ) : null}

        {!isAtBottom ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-card via-card/80 to-transparent" />
        ) : null}
      </div>
    </section>
  );
}

export { OptionsPanelContent };
