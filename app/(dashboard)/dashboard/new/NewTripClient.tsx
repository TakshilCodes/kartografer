"use client";

import { useEffect, useRef, useState } from "react";
import {
    AlertTriangle,
    ArrowRight,
    CalendarDays,
    Car,
    IndianRupee,
    Loader2,
    MapPin,
    PencilLine,
    Route,
    Sparkles,
    Users,
    Utensils,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { createManualTripAction } from "@/actions/trips/create-manual-trip.action";
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
        <section className="min-h-screen bg-dashboard px-3 py-4 sm:px-6 lg:px-8">
            <div className="flex min-h-[calc(100vh-2rem)] w-full items-center justify-center">
                <div className="w-full max-w-3xl rounded-3xl border border-border bg-card p-4 shadow-sm sm:rounded-[28px] sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-warning/10 text-warning sm:h-12 sm:w-12">
                            <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-secondary-foreground sm:text-xs">
                                Draft saved
                            </p>

                            <h1 className="mt-2 text-xl font-black tracking-tight text-foreground sm:text-3xl">
                                {getRecoveryTitle(recovery.errorKind)}
                            </h1>

                            <p className="mt-3 text-sm font-semibold leading-6 text-secondary-foreground">
                                {recovery.message}
                            </p>

                            <div className="mt-5 rounded-2xl border border-border bg-dashboard px-4 py-3 text-sm font-bold leading-6 text-secondary-foreground">
                                You can open the saved draft now and add itinerary items
                                manually. The trip is also available in Recent Trips.
                            </div>

                            <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
                                <button
                                    type="button"
                                    onClick={onOpenDraft}
                                    className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground transition hover:bg-primary-hover"
                                >
                                    Open draft trip
                                    <ArrowRight className="h-4 w-4" />
                                </button>

                                <button
                                    type="button"
                                    onClick={onBackToForm}
                                    className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-2xl border border-border bg-card px-5 py-3 text-sm font-black text-foreground transition hover:bg-card-secondary"
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
    const [submittingMode, setSubmittingMode] = useState<"ai" | "manual" | null>(
        null,
    );
    const submissionLockRef = useRef(false);

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
        "Checking your trip details...",
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
        return <TripGenerationLoading progress={progress} message={loadingMessage} />;
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (submissionLockRef.current) return;
        submissionLockRef.current = true;

        const submitter = (e.nativeEvent as SubmitEvent)
            .submitter as HTMLButtonElement | null;
        const mode = submitter?.value === "manual" ? "manual" : "ai";

        setError(null);
        setAiDraftRecovery(null);
        setIsLoading(true);
        setSubmittingMode(mode);

        if (mode === "ai") {
            setIsGenerating(true);
            setProgress(5);
            setLoadingMessage("Checking your trip details...");
        }

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

        try {
            if (mode === "manual") {
                const result = await createManualTripAction(payload);

                setIsLoading(false);

                if (!result.ok) {
                    submissionLockRef.current = false;
                    setSubmittingMode(null);
                    setError(result.error);
                    return;
                }

                router.refresh();
                router.push(`/dashboard/trips/${result.tripId}/edit`);
                return;
            }

            const result = await createTripAction(payload);

            setIsLoading(false);

            if (!result.ok) {
                submissionLockRef.current = false;
                setSubmittingMode(null);

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
        } catch (submissionError) {
            console.error("CREATE_TRIP_SUBMISSION_ERROR", submissionError);

            submissionLockRef.current = false;
            setIsLoading(false);
            setIsGenerating(false);
            setSubmittingMode(null);
            setProgress(0);
            setLoadingMessage("Checking your trip details...");
            setError("Something went wrong while creating your trip.");
        }
    }

    return (
        <section className="min-h-screen w-full bg-dashboard px-3 py-4 pb-32 sm:px-6 sm:py-5 lg:px-8 lg:pb-10">
            <div className="mx-auto w-full max-w-245 xl:max-w-260">
                <div className="mb-4 rounded-3xl border border-border bg-card p-4 shadow-sm sm:mb-6 sm:rounded-4xl sm:p-6 lg:mb-8">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-[11px] font-black text-secondary-foreground sm:text-xs">
                                <Sparkles className="h-3.5 w-3.5" />
                                Create a new India trip
                            </div>

                            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                                Plan your next journey
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-muted-foreground">
                                Add the basic details first. Kartografer will help you generate,
                                edit, budget, and improve your trip plan.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    <div className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:rounded-4xl sm:p-6">
                        <div className="mb-5 sm:mb-6">
                            <h2 className="text-lg font-black text-foreground">
                                Trip Details
                            </h2>
                            <p className="mt-1 text-sm font-semibold leading-6 text-muted-foreground">
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

                    <div className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:rounded-4xl sm:p-6">
                        <div className="mb-5 sm:mb-6">
                            <h2 className="text-lg font-black text-foreground">
                                Preferences
                            </h2>
                            <p className="mt-1 text-sm font-semibold leading-6 text-muted-foreground">
                                These options help create a better trip structure.
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

                        <div className="mt-4 mb-10 sm:mb-0">
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
                                className="w-full resize-none rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold leading-6 text-foreground outline-none transition placeholder:text-muted-foreground/70 hover:bg-input-hover focus:border-ring focus:ring-4 focus:ring-ring/20"
                            />

                            <div className="mt-2 flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                                <span className="leading-5">Keep requests short and relevant to this trip.</span>
                                <span className="shrink-0 tabular-nums">
                                    {specialNotesCharacterCount}/{MAX_SPECIAL_NOTES_LENGTH}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="fixed inset-x-3 bottom-3 z-30 rounded-3xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur sm:sticky sm:bottom-4 sm:rounded-4xl sm:shadow-sm">
                        <div className="flex flex-col gap-3">
                            {error ? (
                                <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-bold leading-6 text-danger">
                                    {error}
                                </div>
                            ) : null}

                            <div className="rounded-2xl border border-border bg-dashboard/60 p-3 sm:p-4 lg:flex lg:items-center lg:justify-between lg:gap-6">
                                <div className="min-w-0">
                                    <h3 className="text-sm font-black text-foreground">
                                        Choose how you want to begin
                                    </h3>

                                    <p className="mt-1 hidden max-w-xl text-xs font-semibold leading-5 text-secondary-foreground sm:block">
                                        Start with an empty itinerary and plan manually, or let AI generate
                                        the first version for you.
                                    </p>
                                </div>

                                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:mt-0 lg:flex lg:shrink-0 lg:items-center">
                                    <button
                                        type="submit"
                                        name="creationMode"
                                        value="manual"
                                        disabled={isLoading}
                                        className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-black text-foreground transition hover:bg-card-hover disabled:pointer-events-none disabled:opacity-70 lg:min-w-45"
                                    >
                                        {isLoading && submittingMode === "manual" ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <PencilLine className="h-4 w-4" />
                                        )}

                                        {isLoading && submittingMode === "manual"
                                            ? "Creating..."
                                            : "Create Manually"}
                                    </button>

                                    <button
                                        type="submit"
                                        name="creationMode"
                                        value="ai"
                                        disabled={isLoading}
                                        className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground shadow-sm transition hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-70 lg:min-w-48"
                                    >
                                        {isLoading && submittingMode === "ai" ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Sparkles className="h-4 w-4" />
                                        )}

                                        {isLoading && submittingMode === "ai"
                                            ? "Generating..."
                                            : "Generate with AI"}
                                    </button>
                                </div>
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

            <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-border bg-input px-4 py-3 transition hover:bg-input-hover focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/20">
                <span className="shrink-0 text-secondary-foreground">{icon}</span>

                <input
                    id={name}
                    name={name}
                    type={type}
                    min={min}
                    max={max}
                    placeholder={placeholder}
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground/70"
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