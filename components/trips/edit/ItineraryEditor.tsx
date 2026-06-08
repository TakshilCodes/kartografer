"use client";

import type { ReactNode } from "react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    Edit3,
    Hotel,
    MapPin,
    MoreHorizontal,
    Plane,
    Plus,
    Route,
    Sparkles,
    Trash2,
    Utensils,
    Binoculars,
    Compass,
    Landmark,
    Mountain,
    ShoppingBag,
    Waves,
    TreePalm,
    Church,
    Car,
} from "lucide-react";

import {
    createTripDayAction,
    deleteTripDayAction,
    updateTripDayInfoAction,
} from "@/actions/trips/trip-day.action";
import { useConfirmStore } from "@/stores/use-confirm-store";
import {
    createTransportOptionAction,
    deleteTransportOptionAction,
    updateTransportOptionAction,
} from "@/actions/trips/trip-transport.action";
import TransportModal, {
    type TransportFormValues,
} from "./modals/TransportModal";
import DayInfoModal, {
    type DayInfoFormValues,
} from "./modals/DayInfoModal";
import StayModal, {
    type StayFormValues,
    type StayOption,
} from "@/components/trips/edit/modals/StayModal";

import {
    createStayOptionAction,
    deleteStayOptionAction,
    updateStayOptionAction,
} from "@/actions/trips/trip-stay.action";
import MealModal, {
    type MealFormValues,
    type MealSuggestion,
} from "@/components/trips/edit/modals/MealModal";

import {
    createMealSuggestionAction,
    deleteMealSuggestionAction,
    updateMealSuggestionAction,
} from "@/actions/trips/trip-meal.action";
import ActivityModal, {
    type ActivityFormValues,
    type TripActivity,
} from "@/components/trips/edit/modals/ActivityModal";

import {
    createTripActivityAction,
    deleteTripActivityAction,
    updateTripActivityAction,
} from "@/actions/trips/trip-activity.action";

type TripDay = {
    id: string;
    dayNumber: number;
    title: string;
    description: string | null;
    notes: string | null;
    estimatedCost: string | null;
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
    pricePerPerson: string | null;
    totalCost: string | null;
    isSelected: boolean;
    notes: string | null;
};

type ItineraryEditorProps = {
    tripId: string;
    days: TripDay[];
    transportOptions: TransportOption[];
    stayOptions: StayOption[];
    mealSuggestions: MealSuggestion[];
    activities: TripActivity[];
    selectedDay: TripDay | undefined;
    selectedDayId: string;
    onSelectDay: (dayId: string) => void;
};

function getActivityIcon(category: string) {
    switch (category) {
        case "SIGHTSEEING":
            return Binoculars;

        case "ADVENTURE":
            return Mountain;

        case "FOOD":
            return Utensils;

        case "SHOPPING":
            return ShoppingBag;

        case "RELAXATION":
            return Waves;

        case "CULTURE":
            return Landmark;

        case "RELIGIOUS":
            return Church;

        case "NATURE":
            return TreePalm;

        case "TRANSPORT_BREAK":
            return Car;

        case "HIDDEN_SPOT":
            return Compass;

        default:
            return Sparkles;
    }
}

function formatCurrency(amount: string | null) {
    if (!amount) return "₹0";

    const value = Number(amount);

    if (Number.isNaN(value)) return "₹0";

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);
}

function getDisplayDayTitle(day: TripDay | undefined) {
    if (!day) return "";

    const defaultTitle = `Day ${day.dayNumber}`;

    if (!day.title || day.title.trim() === defaultTitle) {
        return "";
    }

    return day.title.trim();
}

function Surface({
    children,
    className = "",
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={`min-w-0 rounded-[26px] border border-border bg-card shadow-sm ${className}`}
        >
            {children}
        </section>
    );
}

function SectionTitle({
    icon,
    title,
    action,
}: {
    icon: ReactNode;
    title: string;
    action?: ReactNode;
}) {
    return (
        <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card-secondary text-primary">
                    {icon}
                </span>
                <h3 className="text-sm font-black text-foreground">{title}</h3>
            </div>

            {action}
        </div>
    );
}

function SmallActionButton({ children }: { children: ReactNode }) {
    return (
        <button
            type="button"
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-black text-foreground transition hover:bg-card-secondary"
        >
            {children}
        </button>
    );
}

export default function ItineraryEditor({
    tripId,
    days,
    transportOptions,
    stayOptions,
    mealSuggestions,
    activities,
    selectedDay,
    selectedDayId,
    onSelectDay,
}: ItineraryEditorProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [message, setMessage] = useState("");
    const [isMessageLeaving, setIsMessageLeaving] = useState(false);
    const [isEditDayOpen, setIsEditDayOpen] = useState(false);
    const [dayInfoModalError, setDayInfoModalError] = useState("");
    const [transportModalError, setTransportModalError] = useState("");
    const [stayModalError, setStayModalError] = useState("");
    const [mealModalError, setMealModalError] = useState("");
    const [activityModalError, setActivityModalError] = useState("");

    const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);
    const [editingTransport, setEditingTransport] = useState<TransportOption | null>(
        null
    );

    const [isStayModalOpen, setIsStayModalOpen] = useState(false);
    const [editingStay, setEditingStay] = useState<StayOption | null>(null);

    const [isMealModalOpen, setIsMealModalOpen] = useState(false);
    const [editingMeal, setEditingMeal] = useState<MealSuggestion | null>(null);

    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<TripActivity | null>(
        null
    );

    const selectedDayTransports = transportOptions.filter((transport) => {
        return transport.isSelected && transport.tripDayId === selectedDay?.id;
    });

    function openEditDayModal() {
        setDayInfoModalError("");
        setIsEditDayOpen(true);
    }

    function openCreateTransportModal() {
        setTransportModalError("");
        setEditingTransport(null);
        setIsTransportModalOpen(true);
    }

    function openEditTransportModal(transport: TransportOption) {
        setTransportModalError("");
        setEditingTransport(transport);
        setIsTransportModalOpen(true);
    }

    const selectedDayStays = stayOptions.filter((stay) => {
        return stay.isSelected && stay.tripDayId === selectedDay?.id;
    });

    function openCreateStayModal() {
        setStayModalError("");
        setEditingStay(null);
        setIsStayModalOpen(true);
    }

    function openEditStayModal(stay: StayOption) {
        setStayModalError("");
        setEditingStay(stay);
        setIsStayModalOpen(true);
    }

    const selectedDayMeals = mealSuggestions.filter((meal) => {
        return meal.tripDayId === selectedDay?.id;
    });

    function openCreateMealModal() {
        setMealModalError("");
        setEditingMeal(null);
        setIsMealModalOpen(true);
    }

    function openEditMealModal(meal: MealSuggestion) {
        setMealModalError("");
        setEditingMeal(meal);
        setIsMealModalOpen(true);
    }

    const selectedDayActivities = activities.filter((activity) => {
        return activity.tripDayId === selectedDay?.id;
    });

    function openCreateActivityModal() {
        setActivityModalError("");
        setEditingActivity(null);
        setIsActivityModalOpen(true);
    }

    function openEditActivityModal(activity: TripActivity) {
        setActivityModalError("");
        setEditingActivity(activity);
        setIsActivityModalOpen(true);
    }

    const confirm = useConfirmStore((state) => state.confirm);

    const displayDayTitle = getDisplayDayTitle(selectedDay);

    useEffect(() => {
        if (!message) return;

        setIsMessageLeaving(false);

        const exitTimer = setTimeout(() => {
            setIsMessageLeaving(true);
        }, 9700);

        const clearTimer = setTimeout(() => {
            setMessage("");
            setIsMessageLeaving(false);
        }, 10000);

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(clearTimer);
        };
    }, [message]);

    function handleCreateDay() {
        setMessage("");

        startTransition(async () => {
            const result = await createTripDayAction({
                tripId,
            });

            setMessage(result.message);

            if (result.success) {
                if (result.day?.id) {
                    onSelectDay(result.day.id);
                }

                router.refresh();
            }
        });
    }

    function handleUpdateDay(values: DayInfoFormValues) {
        if (!selectedDay) return;

        setDayInfoModalError("");
        setMessage("");

        startTransition(async () => {
            const result = await updateTripDayInfoAction({
                tripId,
                tripDayId: selectedDay.id,
                title: values.dayTitle,
                description: values.dayDescription,
                notes: values.dayNotes,
                estimatedCost: values.estimatedCost,
            });

            if (!result.success) {
                setDayInfoModalError(result.message);
                return;
            }

            setMessage(result.message);
            setIsEditDayOpen(false);
            router.refresh();
        });
    }

    async function handleDeleteDay() {
        if (!selectedDay) return;

        const confirmed = await confirm({
            title: `Delete Day ${selectedDay.dayNumber}?`,
            description:
                "This can remove activities and meals connected to this day. This action cannot be undone.",
            confirmText: "Delete day",
            cancelText: "Keep day",
            variant: "danger",
        });

        if (!confirmed) return;

        setMessage("");

        const fallbackDay = days.find((day) => day.id !== selectedDay.id);

        startTransition(async () => {
            const result = await deleteTripDayAction({
                tripId,
                tripDayId: selectedDay.id,
            });

            setMessage(result.message);

            if (result.success) {
                if (fallbackDay) {
                    onSelectDay(fallbackDay.id);
                }

                router.refresh();
            }
        });
    }

    function handleSaveTransport(values: TransportFormValues) {
        if (!selectedDay) return;

        setTransportModalError("");
        setMessage("");

        startTransition(async () => {
            const payload = {
                tripId,
                tripDayId: selectedDay.id,
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
                isSelected: true,
            };

            const result = editingTransport
                ? await updateTransportOptionAction({
                    ...payload,
                    transportOptionId: editingTransport.id,
                })
                : await createTransportOptionAction(payload);

            if (!result.success) {
                setTransportModalError(result.message);
                return;
            }

            setMessage(result.message);
            setIsTransportModalOpen(false);
            setEditingTransport(null);
            router.refresh();
        });
    }

    async function handleDeleteTransport(transport: TransportOption) {
        const confirmed = await confirm({
            title: "Delete transport?",
            description:
                "This transport option will be removed from your itinerary. This action cannot be undone.",
            confirmText: "Delete transport",
            cancelText: "Keep transport",
            variant: "danger",
        });

        if (!confirmed) return;

        setMessage("");

        startTransition(async () => {
            const result = await deleteTransportOptionAction({
                tripId,
                transportOptionId: transport.id,
            });

            setMessage(result.message);

            if (result.success) {
                router.refresh();
            }
        });
    }

    function handleSaveStay(values: StayFormValues) {
        if (!selectedDay) return;

        setStayModalError("");
        setMessage("");

        startTransition(async () => {
            const payload = {
                tripId,
                tripDayId: selectedDay.id,
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
                isSelected: true,
            };

            const result = editingStay
                ? await updateStayOptionAction({
                    ...payload,
                    stayOptionId: editingStay.id,
                })
                : await createStayOptionAction(payload);

            if (!result.success) {
                setStayModalError(result.message);
                return;
            }

            setMessage(result.message);
            setIsStayModalOpen(false);
            setEditingStay(null);
            router.refresh();
        });
    }

    async function handleDeleteStay(stay: StayOption) {
        const confirmed = await confirm({
            title: "Delete stay?",
            description:
                "This stay option will be removed from your itinerary. This action cannot be undone.",
            confirmText: "Delete stay",
            cancelText: "Keep stay",
            variant: "danger",
        });

        if (!confirmed) return;

        setMessage("");

        startTransition(async () => {
            const result = await deleteStayOptionAction({
                tripId,
                stayOptionId: stay.id,
            });

            setMessage(result.message);

            if (result.success) {
                router.refresh();
            }
        });
    }

    function handleSaveMeal(values: MealFormValues) {
        if (!selectedDay) return;

        setMealModalError("");
        setMessage("");

        startTransition(async () => {
            const payload = {
                tripId,
                tripDayId: selectedDay.id,
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
            };

            const result = editingMeal
                ? await updateMealSuggestionAction({
                    ...payload,
                    mealSuggestionId: editingMeal.id,
                })
                : await createMealSuggestionAction(payload);

            if (!result.success) {
                setMealModalError(result.message);
                return;
            }

            setMessage(result.message);
            setIsMealModalOpen(false);
            setEditingMeal(null);
            router.refresh();
        });
    }

    async function handleDeleteMeal(meal: MealSuggestion) {
        const confirmed = await confirm({
            title: "Delete meal?",
            description:
                "This meal will be removed from your itinerary. This action cannot be undone.",
            confirmText: "Delete meal",
            cancelText: "Keep meal",
            variant: "danger",
        });

        if (!confirmed) return;

        setMessage("");

        startTransition(async () => {
            const result = await deleteMealSuggestionAction({
                tripId,
                mealSuggestionId: meal.id,
            });

            setMessage(result.message);

            if (result.success) {
                router.refresh();
            }
        });
    }

    function handleSaveActivity(values: ActivityFormValues) {
        if (!selectedDay) return;

        setActivityModalError("");
        setMessage("");

        startTransition(async () => {
            const payload = {
                tripId,
                tripDayId: selectedDay.id,
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
                position: editingActivity?.position ?? undefined,
            };

            const result = editingActivity
                ? await updateTripActivityAction({
                    ...payload,
                    activityId: editingActivity.id,
                })
                : await createTripActivityAction(payload);

            if (!result.success) {
                setActivityModalError(result.message);
                return;
            }

            setMessage(result.message);
            setIsActivityModalOpen(false);
            setEditingActivity(null);
            router.refresh();
        });
    }

    async function handleDeleteActivity(activity: TripActivity) {
        const confirmed = await confirm({
            title: "Delete activity?",
            description:
                "This activity will be removed from your itinerary. This action cannot be undone.",
            confirmText: "Delete activity",
            cancelText: "Keep activity",
            variant: "danger",
        });

        if (!confirmed) return;

        setMessage("");

        startTransition(async () => {
            const result = await deleteTripActivityAction({
                tripId,
                activityId: activity.id,
            });

            setMessage(result.message);

            if (result.success) {
                router.refresh();
            }
        });
    }

    return (
        <>
            <Surface className="p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-black text-foreground">Select day</h2>
                        <p className="text-xs font-semibold text-secondary-foreground">
                            Choose which day you want to edit
                        </p>
                    </div>

                    <button
                        type="button"
                        disabled={isPending}
                        onClick={handleCreateDay}
                        className="inline-flex items-center justify-center cursor-pointer gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-black text-foreground transition hover:bg-card-secondary disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        {isPending ? "Adding..." : "Add day"}
                    </button>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden">
                    {days.map((day, index) => {
                        const isActive = day.id === selectedDayId;
                        const dayDisplayTitle = getDisplayDayTitle(day);

                        return (
                            <button
                                key={day.id}
                                type="button"
                                onClick={() => onSelectDay(day.id)}
                                className={`min-w-45 cursor-pointer rounded-2xl border px-4 py-3 text-left transition ${isActive
                                    ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/15"
                                    : "border-border bg-dashboard text-foreground hover:bg-card-secondary"
                                    }`}
                            >
                                <p className="text-sm font-black">Day {day.dayNumber}</p>

                                <p
                                    className={`mt-0.5 line-clamp-1 text-xs font-semibold ${isActive
                                        ? "text-primary-foreground/80"
                                        : "text-secondary-foreground"
                                        }`}
                                >
                                    {dayDisplayTitle || "---"}
                                </p>
                            </button>
                        );
                    })}
                </div>

                {message ? (
                    <div
                        className={`mt-3 rounded-2xl border border-border bg-card-secondary px-4 py-3 text-sm font-bold text-secondary-foreground shadow-sm ${isMessageLeaving ? "animate-slide-fade-out" : "animate-slide-fade-in"
                            }`}
                    >
                        {message}
                    </div>
                ) : null}
            </Surface>

            <Surface className="overflow-hidden">
                <div className="border-b border-border bg-card-secondary/50 px-4 py-4 sm:px-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-secondary-foreground">
                                Final itinerary panel
                            </p>

                            <h2 className="mt-1 text-2xl font-black text-foreground">
                                Day {selectedDay?.dayNumber ?? 1}
                                {displayDayTitle ? ` — ${displayDayTitle}` : ""}
                            </h2>

                            <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary-foreground">
                                {selectedDay?.description}
                            </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            <button
                                type="button"
                                onClick={openEditDayModal}
                                disabled={!selectedDay}
                                className="inline-flex h-9 items-center justify-center cursor-pointer gap-2 whitespace-nowrap rounded-full border border-border bg-card px-4 text-xs font-black text-foreground transition hover:bg-card-secondary disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                <Edit3 className="h-4 w-4" />
                                Edit day info
                            </button>

                            <button
                                type="button"
                                onClick={handleDeleteDay}
                                disabled={isPending || !selectedDay || days.length <= 1}
                                className="inline-flex h-9 items-center justify-center cursor-pointer gap-2 whitespace-nowrap rounded-full border border-border bg-card px-4 text-xs font-black text-foreground transition hover:bg-card-secondary disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete day
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-5 p-4 sm:p-5">
                    <section>
                        <SectionTitle
                            icon={<Route className="h-4 w-4" />}
                            title="Selected transport"
                            action={
                                <button
                                    type="button"
                                    onClick={openCreateTransportModal}
                                    className="inline-flex items-center justify-center cursor-pointer gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-black text-foreground transition hover:bg-card-secondary"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add transport
                                </button>
                            }
                        />

                        <div className="space-y-2">
                            {selectedDayTransports.length > 0 ? (
                                selectedDayTransports.map((transport) => (
                                    <div
                                        key={transport.id}
                                        className="rounded-2xl border border-border bg-dashboard p-3"
                                    >
                                        <div className="flex min-w-0 gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card text-primary">
                                                <Route className="h-4 w-4" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                                    <p className="min-w-0 wrap-break-word text-sm font-black text-foreground">
                                                        {transport.title}
                                                    </p>

                                                    <span className="shrink-0 rounded-full bg-card-secondary px-2 py-0.5 text-[10px] font-black text-primary">
                                                        {transport.mode.replace("_", " ")}
                                                    </span>
                                                </div>

                                                {(transport.fromText || transport.toText) ? (
                                                    <p className="mt-1 wrap-break-word text-xs font-bold text-secondary-foreground">
                                                        {transport.fromText || "Start"} → {transport.toText || "End"}
                                                    </p>
                                                ) : null}

                                                {transport.description ? (
                                                    <p className="mt-1 wrap-break-word text-xs leading-5 text-secondary-foreground">
                                                        {transport.description}
                                                    </p>
                                                ) : null}

                                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                                    <span className="rounded-full bg-card-secondary px-2.5 py-1 text-[11px] font-black text-primary">
                                                        {transport.costType === "PER_PERSON"
                                                            ? transport.pricePerPerson
                                                                ? `₹${Number(transport.pricePerPerson).toLocaleString(
                                                                    "en-IN"
                                                                )}/person`
                                                                : "Cost not set"
                                                            : transport.totalCost
                                                                ? `₹${Number(transport.totalCost).toLocaleString("en-IN")}`
                                                                : "Cost not set"}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() => openEditTransportModal(transport)}
                                                        className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-black text-foreground transition hover:bg-card-secondary"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteTransport(transport)}
                                                        className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-black text-foreground transition hover:bg-card-secondary"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-2xl border border-dashed border-border bg-dashboard p-4 text-sm font-bold text-secondary-foreground">
                                    No transport added for this day yet.
                                </div>
                            )}
                        </div>
                    </section>

                    <section>
                        <SectionTitle
                            icon={<Hotel className="h-4 w-4" />}
                            title="Selected stay"
                            action={
                                <button
                                    type="button"
                                    onClick={openCreateStayModal}
                                    className="inline-flex items-center justify-center cursor-pointer gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-black text-foreground transition hover:bg-card-secondary"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add stay
                                </button>
                            }
                        />

                        <div className="space-y-2">
                            {selectedDayStays.length > 0 ? (
                                selectedDayStays.map((stay) => (
                                    <div
                                        key={stay.id}
                                        className="rounded-2xl border border-border bg-dashboard p-3"
                                    >
                                        <div className="flex min-w-0 gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card text-primary">
                                                <Hotel className="h-4 w-4" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                                    <p className="min-w-0 wrap-break-word text-sm font-black text-foreground">
                                                        {stay.name}
                                                    </p>

                                                    <span className="shrink-0 rounded-full bg-card-secondary px-2 py-0.5 text-[10px] font-black text-primary">
                                                        {stay.stayType.replace("_", " ")}
                                                    </span>
                                                </div>

                                                {(stay.city || stay.area) ? (
                                                    <p className="mt-1 wrap-break-word text-xs font-bold text-secondary-foreground">
                                                        {[stay.area, stay.city].filter(Boolean).join(", ")}
                                                    </p>
                                                ) : null}

                                                {stay.bestFor ? (
                                                    <p className="mt-1 wrap-break-word text-xs leading-5 text-secondary-foreground">
                                                        {stay.bestFor}
                                                    </p>
                                                ) : null}

                                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                                    <span className="rounded-full bg-card-secondary px-2.5 py-1 text-[11px] font-black text-primary">
                                                        {stay.totalCost
                                                            ? `₹${Number(stay.totalCost).toLocaleString("en-IN")}`
                                                            : stay.pricePerNight
                                                                ? `₹${Number(stay.pricePerNight).toLocaleString(
                                                                    "en-IN"
                                                                )}/night`
                                                                : "Cost not set"}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() => openEditStayModal(stay)}
                                                        className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-black text-foreground transition hover:bg-card-secondary"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteStay(stay)}
                                                        className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-black text-foreground transition hover:bg-card-secondary"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-2xl border border-dashed border-border bg-dashboard p-4 text-sm font-bold text-secondary-foreground">
                                    No stay added for this day yet.
                                </div>
                            )}
                        </div>
                    </section>

                    <section>
                        <SectionTitle
                            icon={<Utensils className="h-4 w-4" />}
                            title="Meals"
                            action={
                                <button
                                    type="button"
                                    onClick={openCreateMealModal}
                                    className="inline-flex items-center justify-center cursor-pointer gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-black text-foreground transition hover:bg-card-secondary"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add meal
                                </button>
                            }
                        />

                        <div className="grid gap-2 md:grid-cols-2">
                            {selectedDayMeals.length > 0 ? (
                                selectedDayMeals.map((meal) => (
                                    <div
                                        key={meal.id}
                                        className="rounded-2xl border border-border bg-dashboard px-3 py-3"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-xs font-black uppercase tracking-[0.16em] text-secondary-foreground">
                                                        {meal.mealType.replace("_", " ")}
                                                    </p>

                                                    {meal.estimatedCost ? (
                                                        <span className="rounded-full bg-card-secondary px-2 py-0.5 text-[10px] font-black text-primary">
                                                            ₹{Number(meal.estimatedCost).toLocaleString("en-IN")}
                                                        </span>
                                                    ) : null}
                                                </div>

                                                <p className="mt-1 wrap-break-word text-sm font-black text-foreground">
                                                    {meal.title}
                                                </p>

                                                {meal.locationName ? (
                                                    <p className="mt-1 wrap-break-word text-xs font-bold text-secondary-foreground">
                                                        {meal.locationName}
                                                    </p>
                                                ) : null}

                                                {meal.notes ? (
                                                    <p className="mt-1 wrap-break-word text-xs leading-5 text-secondary-foreground">
                                                        {meal.notes}
                                                    </p>
                                                ) : null}
                                            </div>

                                            <div className="flex shrink-0 items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditMealModal(meal)}
                                                    className="rounded-full border border-border cursor-pointer bg-card px-3 py-1.5 text-[11px] font-black text-foreground transition hover:bg-card-secondary"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteMeal(meal)}
                                                    className="rounded-full border border-border cursor-pointer bg-card px-3 py-1.5 text-[11px] font-black text-foreground transition hover:bg-card-secondary"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-2xl border border-dashed border-border bg-dashboard p-4 text-sm font-bold text-secondary-foreground md:col-span-2">
                                    No meals added for this day yet.
                                </div>
                            )}
                        </div>
                    </section>

                    <section>
                        <SectionTitle
                            icon={<Sparkles className="h-4 w-4" />}
                            title="Activities"
                            action={
                                <button
                                    type="button"
                                    onClick={openCreateActivityModal}
                                    className="inline-flex items-center justify-center cursor-pointer gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-black text-foreground transition hover:bg-card-secondary"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add activity
                                </button>
                            }
                        />

                        <div className="space-y-2">
                            {selectedDayActivities.length > 0 ? (
                                selectedDayActivities.map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="rounded-2xl border border-border bg-dashboard px-3 py-3"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 flex-1 gap-3">
                                                {(() => {
                                                    const ActivityIcon = getActivityIcon(activity.category);

                                                    return (
                                                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card text-primary">
                                                            <ActivityIcon className="h-4 w-4" />
                                                        </div>
                                                    );
                                                })()}

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                                                        <p className="min-w-0 wrap-break-word text-sm font-black text-foreground">
                                                            {activity.title}
                                                        </p>

                                                        <span className="shrink-0 rounded-full bg-card-secondary px-2 py-0.5 text-[10px] font-black text-primary">
                                                            {activity.category.replace("_", " ")}
                                                        </span>

                                                        {activity.estimatedCost ? (
                                                            <span className="shrink-0 rounded-full bg-card-secondary px-2 py-0.5 text-[10px] font-black text-primary">
                                                                ₹{Number(activity.estimatedCost).toLocaleString("en-IN")}
                                                            </span>
                                                        ) : null}
                                                    </div>

                                                    {(activity.startTime || activity.endTime) ? (
                                                        <p className="mt-1 text-xs font-bold text-secondary-foreground">
                                                            {activity.startTime || "Start"} → {activity.endTime || "End"}
                                                        </p>
                                                    ) : null}

                                                    {activity.locationName ? (
                                                        <p className="mt-1 wrap-break-word text-xs font-bold text-secondary-foreground">
                                                            {activity.locationName}
                                                        </p>
                                                    ) : null}

                                                    {activity.description ? (
                                                        <p className="mt-1 max-w-full wrap-break-word text-xs leading-5 text-secondary-foreground">
                                                            {activity.description}
                                                        </p>
                                                    ) : null}

                                                    {activity.notes ? (
                                                        <p className="mt-1 max-w-full wrap-break-word text-xs leading-5 text-secondary-foreground">
                                                            Note: {activity.notes}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditActivityModal(activity)}
                                                    className="rounded-full cursor-pointer border border-border bg-card px-3 py-1.5 text-[11px] font-black text-foreground transition hover:bg-card-secondary"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteActivity(activity)}
                                                    className="rounded-full cursor-pointer border border-border bg-card px-3 py-1.5 text-[11px] font-black text-foreground transition hover:bg-card-secondary"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-2xl border border-dashed border-border bg-dashboard p-4 text-sm font-bold text-secondary-foreground">
                                    No activities added for this day yet.
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                        <div className="rounded-2xl border border-border bg-dashboard p-4">
                            <div className="mb-2 flex items-center justify-between">
                                <h3 className="text-sm font-black text-foreground">
                                    Day notes
                                </h3>

                                <button
                                    type="button"
                                    onClick={openEditDayModal}
                                    className="text-secondary-foreground transition hover:text-foreground cursor-pointer"
                                >
                                    <Edit3 className="h-4 w-4" />
                                </button>
                            </div>

                            <p className="text-sm leading-6 text-secondary-foreground">
                                {selectedDay?.notes}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-primary p-4 text-primary-foreground">
                            <p className="text-xs font-bold opacity-80">
                                Day estimated cost
                            </p>
                            <p className="mt-1 text-2xl font-black">
                                {selectedDay?.estimatedCost
                                    ? formatCurrency(selectedDay.estimatedCost)
                                    : "Not added"}
                            </p>
                        </div>
                    </section>
                </div>
            </Surface>

            {isEditDayOpen ? (
                <DayInfoModal
                    isOpen={isEditDayOpen}
                    isPending={isPending}
                    error={dayInfoModalError}
                    dayNumber={selectedDay?.dayNumber}
                    dayId={selectedDay?.id}
                    initialValues={
                        selectedDay
                            ? {
                                  dayTitle: selectedDay.title,
                                  dayDescription: selectedDay.description ?? "",
                                  dayNotes: selectedDay.notes ?? "",
                                  estimatedCost: selectedDay.estimatedCost ?? "",
                              }
                            : null
                    }
                    onClose={() => {
                        setDayInfoModalError("");
                        setIsEditDayOpen(false);
                    }}
                    onSave={handleUpdateDay}
                />
            ) : null}

            {isTransportModalOpen ? (
                <TransportModal
                    isOpen={isTransportModalOpen}
                    isPending={isPending}
                    error={transportModalError}
                    editingTransport={editingTransport}
                    selectedDayNumber={selectedDay?.dayNumber}
                    onClose={() => {
                        setTransportModalError("");
                        setIsTransportModalOpen(false);
                    }}
                    onSave={handleSaveTransport}
                />
            ) : null}

            {isStayModalOpen ? (
                <StayModal
                    isOpen={isStayModalOpen}
                    isPending={isPending}
                    error={stayModalError}
                    editingStay={editingStay}
                    selectedDayNumber={selectedDay?.dayNumber}
                    onClose={() => {
                        setStayModalError("");
                        setIsStayModalOpen(false);
                    }}
                    onSave={handleSaveStay}
                />
            ) : null}

            {isMealModalOpen ? (
                <MealModal
                    isOpen={isMealModalOpen}
                    isPending={isPending}
                    error={mealModalError}
                    editingMeal={editingMeal}
                    selectedDayNumber={selectedDay?.dayNumber}
                    onClose={() => {
                        setMealModalError("");
                        setIsMealModalOpen(false);
                    }}
                    onSave={handleSaveMeal}
                />
            ) : null}

            {isActivityModalOpen ? (
                <ActivityModal
                    isOpen={isActivityModalOpen}
                    isPending={isPending}
                    error={activityModalError}
                    editingActivity={editingActivity}
                    selectedDayNumber={selectedDay?.dayNumber}
                    onClose={() => {
                        setActivityModalError("");
                        setIsActivityModalOpen(false);
                    }}
                    onSave={handleSaveActivity}
                />
            ) : null}
        </>
    );
}