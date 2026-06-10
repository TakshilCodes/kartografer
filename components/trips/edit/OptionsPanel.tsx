"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Edit3,
  Hotel,
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

type OptionsPanelProps = OptionsPanelContentProps;

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

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-dashboard p-4 text-sm font-bold leading-6 text-secondary-foreground">
      No saved options yet. AI suggestions will appear here later.
    </div>
  );
}

function GroupHeader({
  icon,
  title,
}: {
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="mb-2 flex items-center gap-2">
      {icon}
      <h3 className="text-xs font-black uppercase tracking-[0.16em] text-secondary-foreground">
        {title}
      </h3>
    </div>
  );
}

function AddToPlanButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => Promise<boolean>;
}) {
  const [isAdding, setIsAdding] = useState(false);

  async function handleClick() {
    if (isAdding) return;

    setIsAdding(true);

    try {
      await onClick();
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={isAdding}
      onClick={handleClick}
      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Plus className="h-4 w-4" />
    </button>
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

  useEffect(() => {
    if (!message) return;

    const clearTimer = setTimeout(() => {
      setMessage("");
    }, 5000);

    return () => clearTimeout(clearTimer);
  }, [message]);

  const unselectedTransports = transportOptions.filter(
    (option) => !option.isSelected
  );
  const unselectedStays = stayOptions.filter((option) => !option.isSelected);
  const unselectedMeals = mealSuggestions.filter((meal) => !meal.isSelected);
  const unselectedActivities = activities.filter(
    (activity) => !activity.isSelected
  );
  const hasOptions =
    unselectedTransports.length > 0 ||
    unselectedStays.length > 0 ||
    unselectedMeals.length > 0 ||
    unselectedActivities.length > 0;

  async function handleSelectTransport(option: TransportOption) {
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

    if (result.success) {
      router.refresh();
    }

    return result.success;
  }

  async function handleDeleteTransport(option: TransportOption) {
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

    if (result.success) {
      router.refresh();
    }

    return result.success;
  }

  async function handleSelectStay(option: StayOption) {
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

    if (result.success) {
      router.refresh();
    }

    return result.success;
  }

  async function handleDeleteStay(option: StayOption) {
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

    if (result.success) {
      router.refresh();
    }

    return result.success;
  }

  async function handleSelectMeal(meal: SelectableMealSuggestion) {
    setMessage("");

    const result = await selectMealSuggestionAction({
      tripId,
      mealSuggestionId: meal.id,
    });

    setMessage(result.message);

    if (result.success) {
      router.refresh();
    }

    return result.success;
  }

  async function handleDeleteMeal(meal: SelectableMealSuggestion) {
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

    if (result.success) {
      router.refresh();
    }

    return result.success;
  }

  async function handleSelectActivity(activity: SelectableTripActivity) {
    setMessage("");

    const result = await selectTripActivityAction({
      tripId,
      activityId: activity.id,
    });

    setMessage(result.message);

    if (result.success) {
      router.refresh();
    }

    return result.success;
  }

  async function handleDeleteActivity(activity: SelectableTripActivity) {
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

    if (result.success) {
      router.refresh();
    }

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
          | "BUDGET"
          | "MID_RANGE"
          | "PREMIUM"
          | "LUXURY",
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
          | "BREAKFAST"
          | "LUNCH"
          | "DINNER"
          | "SNACK"
          | "OTHER",
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
            />

            <div className="space-y-2">
              {unselectedTransports.map((option) => (
                <div
                  key={option.id}
                  className="rounded-2xl border border-border bg-dashboard p-2.5 transition hover:bg-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="wrap-break-word text-[13px] font-black text-foreground">
                        {option.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] font-semibold text-secondary-foreground">
                        {option.mode.replace("_", " ")} -{" "}
                        {getDayLabel(days, option.tripDayId)}
                      </p>
                      <p className="mt-2 text-[11px] font-black text-primary">
                        {formatMoney(option.totalCost ?? option.pricePerPerson)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <AddToPlanButton
                        label="Add transport to plan"
                        onClick={() => handleSelectTransport(option)}
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
                            onClick: () => handleDeleteTransport(option),
                          },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {unselectedStays.length > 0 ? (
          <div>
            <GroupHeader
              icon={<Hotel className="h-4 w-4 text-primary" />}
              title="Stay options"
            />

            <div className="space-y-2">
              {unselectedStays.map((option) => (
                <div
                  key={option.id}
                  className="rounded-2xl border border-border bg-dashboard p-2.5 transition hover:bg-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="wrap-break-word text-[13px] font-black text-foreground">
                        {option.name}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] font-semibold text-secondary-foreground">
                        {option.stayType.replace("_", " ")} -{" "}
                        {option.city ?? getDayLabel(days, option.tripDayId)}
                      </p>
                      <p className="mt-2 text-[11px] font-black text-primary">
                        {formatMoney(option.totalCost ?? option.pricePerNight)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <AddToPlanButton
                        label="Add stay to plan"
                        onClick={() => handleSelectStay(option)}
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
                            onClick: () => handleDeleteStay(option),
                          },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {unselectedMeals.length > 0 ? (
          <div>
            <GroupHeader
              icon={<Utensils className="h-4 w-4 text-primary" />}
              title="Meal options"
            />

            <div className="space-y-2">
              {unselectedMeals.map((meal) => (
                <div
                  key={meal.id}
                  className="rounded-2xl border border-border bg-dashboard p-2.5 transition hover:bg-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="wrap-break-word text-[13px] font-black text-foreground">
                        {meal.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] font-semibold text-secondary-foreground">
                        {meal.mealType.replace("_", " ")} -{" "}
                        {meal.locationName ?? getDayLabel(days, meal.tripDayId)}
                      </p>
                      <p className="mt-2 text-[11px] font-black text-primary">
                        {formatMoney(meal.estimatedCost)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <AddToPlanButton
                        label="Add meal to plan"
                        onClick={() => handleSelectMeal(meal)}
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
                            onClick: () => handleDeleteMeal(meal),
                          },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {unselectedActivities.length > 0 ? (
          <div>
            <GroupHeader
              icon={<Sparkles className="h-4 w-4 text-primary" />}
              title="Activity options"
            />

            <div className="space-y-2">
              {unselectedActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-2xl border border-border bg-dashboard p-2.5 transition hover:bg-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="wrap-break-word text-[13px] font-black text-foreground">
                        {activity.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] font-semibold text-secondary-foreground">
                        {activity.category.replace("_", " ")} -{" "}
                        {activity.locationName ??
                          getDayLabel(days, activity.tripDayId)}
                      </p>
                      <p className="mt-2 text-[11px] font-black text-primary">
                        {formatMoney(activity.estimatedCost)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <AddToPlanButton
                        label="Add activity to plan"
                        onClick={() => handleSelectActivity(activity)}
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
                            onClick: () => handleDeleteActivity(activity),
                          },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              ))}
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

export default function OptionsPanel(props: OptionsPanelProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);

  function handleScroll() {
    const element = scrollRef.current;

    if (!element) return;

    const distanceFromTop = element.scrollTop;
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;

    setIsAtTop(distanceFromTop < 8);
    setIsAtBottom(distanceFromBottom < 8);
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[26px] border border-border bg-card shadow-sm">
      <div className="shrink-0 border-b border-border bg-card-secondary/50 px-4 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <div>
            <h2 className="text-sm font-black text-foreground">
              Options Panel
            </h2>
            <p className="text-xs font-semibold text-secondary-foreground">
              Saved suggestions waiting outside the final plan
            </p>
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
