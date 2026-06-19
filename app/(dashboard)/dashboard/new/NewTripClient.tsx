"use client";

import { useEffect, useState } from "react";
import {
    AlertTriangle,
    ArrowRight,
    CalendarDays,
    Car,
    IndianRupee,
    Loader2,
    MapPin,
    Route,
    Sparkles,
    Users,
    Utensils,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createTripAction } from "@/actions/trips/create-trip.action";
import PlaceAutocomplete from "@/components/dashboard/PlaceAutocomplete";
import CustomSelect from "@/components/shared/CustomSelect";
import TripGenerationLoading from "@/components/trips/new/TripGenerationLoading";
import {
    countNonWhitespaceCharacters,
    MAX_SPECIAL_NOTES_LENGTH,
    MAX_TRIP_DAYS,
    MAX_TRIP_PEOPLE,
} from "@/lib/trips/trip-limits";

const tripTypeOptions = [
    { label: "Family Trip", value: "Family Trip" },
    { label: "Adventure", value: "Adventure" },
    { label: "Relaxed Vacation", value: "Relaxed Vacation" },
    { label: "Road Trip", value: "Road Trip" },
    { label: "Religious Trip", value: "Religious Trip" },
    { label: "Budget Trip", value: "Budget Trip" },
];

const transportOptions = [
    { label: "Any", value: "Any" },
    { label: "Train", value: "Train" },
    { label: "Flight", value: "Flight" },
    { label: "Cab", value: "Cab" },
    { label: "Bus", value: "Bus" },
    { label: "Self Drive", value: "Self Drive" },
];

const foodOptions = [
    { label: "Vegetarian", value: "Vegetarian" },
    { label: "Non-Vegetarian", value: "Non-Vegetarian" },
    { label: "Jain", value: "Jain" },
    { label: "Any", value: "Any" },
];

const paceOptions = [
    { label: "Relaxed", value: "Relaxed" },
    { label: "Balanced", value: "Balanced" },
    { label: "Fast", value: "Fast" },
];

type AiDraftRecovery = {
    tripId: string;
    message: string;
    errorKind?: string | null;
};

function getRecoveryTitle(errorKind?: string | null) {
    if (errorKind === "AI_RATE_LIMIT") return "AI limit reached";
    if (errorKind === "AI_BUSY") return "AI is busy right now";

    return "Trip draft saved";
}

function AiDraftRecoveryScreen({
    recovery,
    onOpenDraft,
    onBackToForm,
}: {
    recovery: AiDraftRecovery;
    onOpenDraft: () => void;
    onBackToForm: () => void;
}) {
    return (
        <section className="min-h-screen bg-dashboard px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-3xl items-center">
                <div className="w-full rounded-[28px] border border-border bg-card p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-warning/10 text-warning">
                            <AlertTriangle className="h-6 w-6" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-secondary-foreground">
                                Draft saved
                            </p>

                            <h1 className="mt-2 text-2xl font-black text-foreground sm:text-3xl">
                                {getRecoveryTitle(recovery.errorKind)}
                            </h1>

                            <p className="mt-3 text-sm font-semibold leading-6 text-secondary-foreground">
                                {recovery.message}
                            </p>

                            <div className="mt-5 rounded-2xl border border-border bg-dashboard px-4 py-3 text-sm font-bold leading-6 text-secondary-foreground">
                                You can open the saved draft now and add itinerary items manually.
                                The trip is also available in Recent Trips.
                            </div>

                            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={onOpenDraft}
                                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground transition hover:bg-primary-hover"
                                >
                                    Open draft trip
                                    <ArrowRight className="h-4 w-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={onBackToForm}
                                    className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-border bg-card px-5 py-3 text-sm font-black text-foreground transition hover:bg-card-secondary"
                                >
                                    Back to form
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function NewTripClient() {
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [aiDraftRecovery, setAiDraftRecovery] =
        useState<AiDraftRecovery | null>(null);

    const [tripType, setTripType] = useState("Family Trip");
    const [transport, setTransport] = useState("Any");
    const [food, setFood] = useState("Any");
    const [pace, setPace] = useState("Balanced");
    const [specialNotes, setSpecialNotes] = useState("");
    const specialNotesCharacterCount =
        countNonWhitespaceCharacters(specialNotes);

    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState(
        "Checking your trip details..."
    );

    useEffect(() => {
        if (!isGenerating) return;

        const steps = [
            {
                progress: 8,
                message: "Checking your trip details...",
            },
            {
                progress: 18,
                message: "Preparing your travel preferences...",
            },
            {
                progress: 32,
                message: "Finding the best route...",
            },
            {
                progress: 46,
                message: "Planning your day-wise itinerary...",
            },
            {
                progress: 60,
                message: "Choosing stays and local transport...",
            },
            {
                progress: 74,
                message: "Adding meals, activities, and backup options...",
            },
            {
                progress: 88,
                message: "Calculating your estimated budget...",
            },
            {
                progress: 96,
                message: "Finalizing your trip...",
            },
        ];

        let index = 0;

        const interval = window.setInterval(() => {
            const step = steps[index];

            if (!step) {
                window.clearInterval(interval);
                return;
            }

            setProgress(step.progress);
            setLoadingMessage(step.message);

            index += 1;
        }, 2200);

        return () => window.clearInterval(interval);
    }, [isGenerating]);

    if (aiDraftRecovery) {
        return (
            <AiDraftRecoveryScreen
                recovery={aiDraftRecovery}
                onOpenDraft={() => {
                    router.refresh();
                    router.push(`/dashboard/trips/${aiDraftRecovery.tripId}`);
                }}
                onBackToForm={() => {
                    setAiDraftRecovery(null);
                    setError(null);
                    setSpecialNotes("");
                    setProgress(0);
                    setLoadingMessage("Checking your trip details...");
                }}
            />
        );
    }

    if (isGenerating) {
        return (
            <TripGenerationLoading
                progress={progress}
                message={loadingMessage}
            />
        );
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        setError(null);
        setAiDraftRecovery(null);
        setIsLoading(true);
        setIsGenerating(true);
        setProgress(5);
        setLoadingMessage("Checking your trip details...");

        const formData = new FormData(e.currentTarget);

        const payload = {
            fromPlace: formData.get("fromPlace"),
            toPlace: formData.get("toPlace"),
            days: formData.get("days"),
            people: formData.get("people"),
            budget: formData.get("budget"),
            tripType: formData.get("tripType"),
            transport: formData.get("transport"),
            food: formData.get("food"),
            pace: formData.get("pace"),
            notes: formData.get("notes"),
        };

        const result = await createTripAction(payload);

        setIsLoading(false);

        if (!result.ok) {
            if (result.tripId) {
                router.refresh();
                setIsGenerating(false);
                setProgress(0);
                setLoadingMessage("Checking your trip details...");
                setAiDraftRecovery({
                    tripId: result.tripId,
                    message: result.error,
                    errorKind: result.errorKind,
                });
                return;
            }

            setIsGenerating(false);
            setProgress(0);
            setLoadingMessage("Checking your trip details...");
            setError(result.error);
            return;
        }

        setProgress(100);
        setLoadingMessage("Trip ready. Opening your itinerary...");
        router.refresh();

        window.setTimeout(() => {
            router.push(`/dashboard/trips/${result.tripId}`);
        }, 900);
    }
    return (
        <section className="min-h-screen bg-dashboard px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
                <div className="mb-8 rounded-4xl border border-border bg-card p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-black text-secondary-foreground">
                                <Sparkles className="h-3.5 w-3.5" />
                                Create a new India trip
                            </div>

                            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                                Plan your next journey
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-muted-foreground">
                                Add the basic details first. Kartografer will later help you
                                generate, edit, budget, and improve your trip plan.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="rounded-4xl border border-border bg-card p-5 shadow-sm sm:p-6">
                        <div className="mb-6">
                            <h2 className="text-lg font-black text-foreground">
                                Trip Details
                            </h2>
                            <p className="mt-1 text-sm font-semibold text-muted-foreground">
                                Tell us where you are going and how long the trip will be.
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <PlaceAutocomplete
                                name="fromPlace"
                                label="From"
                                placeholder="Search starting city..."
                                icon={<MapPin className="h-4 w-4" />}
                            />

                            <PlaceAutocomplete
                                name="toPlace"
                                label="Destination"
                                placeholder="Search destination..."
                                icon={<Route className="h-4 w-4" />}
                            />

                            <InputField
                                icon={<CalendarDays className="h-4 w-4" />}
                                label="Number of Days"
                                name="days"
                                type="number"
                                min="1"
                                max={MAX_TRIP_DAYS.toString()}
                                placeholder="7"
                                helperText={`Maximum ${MAX_TRIP_DAYS} days per trip.`}
                            />

                            <InputField
                                icon={<Users className="h-4 w-4" />}
                                label="People"
                                name="people"
                                type="number"
                                min="1"
                                max={MAX_TRIP_PEOPLE.toString()}
                                placeholder="3"
                                helperText={`Maximum ${MAX_TRIP_PEOPLE} people per trip.`}
                            />

                            <InputField
                                icon={<IndianRupee className="h-4 w-4" />}
                                label="Budget"
                                name="budget"
                                type="number"
                                min="0"
                                placeholder="70000"
                            />

                            <CustomSelect
                                icon={<Sparkles className="h-4 w-4" />}
                                label="Trip Type"
                                name="tripType"
                                value={tripType}
                                options={tripTypeOptions}
                                onChange={setTripType}
                            />
                        </div>
                    </div>

                    <div className="rounded-4xl border border-border bg-card p-5 shadow-sm sm:p-6">
                        <div className="mb-6">
                            <h2 className="text-lg font-black text-foreground">
                                Preferences
                            </h2>
                            <p className="mt-1 text-sm font-semibold text-muted-foreground">
                                These options will help create a better trip structure later.
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <CustomSelect
                                icon={<Car className="h-4 w-4" />}
                                label="Transport"
                                name="transport"
                                value={transport}
                                options={transportOptions}
                                onChange={setTransport}
                            />

                            <CustomSelect
                                icon={<Utensils className="h-4 w-4" />}
                                label="Food Preference"
                                name="food"
                                value={food}
                                options={foodOptions}
                                onChange={setFood}
                            />

                            <CustomSelect
                                icon={<Route className="h-4 w-4" />}
                                label="Travel Pace"
                                name="pace"
                                value={pace}
                                options={paceOptions}
                                onChange={setPace}
                            />
                        </div>

                        <div className="mt-4">
                            <label
                                htmlFor="notes"
                                className="mb-2 block text-sm font-black text-foreground"
                            >
                                Special Notes
                            </label>

                            <textarea
                                id="notes"
                                name="notes"
                                rows={5}
                                value={specialNotes}
                                onChange={(event) => {
                                    const nextValue = event.currentTarget.value;

                                    if (
                                        countNonWhitespaceCharacters(nextValue) <=
                                        MAX_SPECIAL_NOTES_LENGTH
                                    ) {
                                        setSpecialNotes(nextValue);
                                    }
                                }}
                                placeholder="Example: Need family-friendly hotels, avoid risky roads, include snow places, keep budget low..."
                                className="w-full resize-none rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground/70 hover:bg-input-hover focus:border-ring focus:ring-4 focus:ring-ring/20"
                            />
                            <div className="mt-1.5 flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
                                <span>Keep requests short and relevant to this trip.</span>
                                <span className="shrink-0 tabular-nums">
                                    {specialNotesCharacterCount}/{MAX_SPECIAL_NOTES_LENGTH}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="sticky bottom-4 rounded-4xl border border-border bg-card/95 p-3 shadow-sm backdrop-blur">
                        <div className="flex flex-col gap-3">
                            {error && (
                                <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-bold text-danger">
                                    {error}
                                </div>
                            )}

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="px-2 text-xs font-bold text-muted-foreground">
                                    This will create a basic trip draft. AI generation will be added
                                    later.
                                </p>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground shadow-sm transition hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-70"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Creating Trip...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4" />
                                            Create Trip
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </section>
    );
}

type InputFieldProps = {
    icon: React.ReactNode;
    label: string;
    name: string;
    placeholder: string;
    type?: string;
    min?: string;
    max?: string;
    helperText?: string;
};

function InputField({
    icon,
    label,
    name,
    placeholder,
    type = "text",
    min,
    max,
    helperText,
}: InputFieldProps) {
    return (
        <div>
            <label
                htmlFor={name}
                className="mb-2 block text-sm font-black text-foreground"
            >
                {label}
            </label>

            <div className="flex items-center gap-3 rounded-2xl border border-border bg-input px-4 py-3 transition hover:bg-input-hover focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/20">
                <span className="text-secondary-foreground">{icon}</span>

                <input
                    id={name}
                    name={name}
                    type={type}
                    min={min}
                    max={max}
                    placeholder={placeholder}
                    className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground/70"
                />
            </div>

            {helperText ? (
                <p className="mt-1.5 text-xs font-semibold text-muted-foreground">
                    {helperText}
                </p>
            ) : null}
        </div>
    );
}
