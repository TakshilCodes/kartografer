"use client";

import { useState } from "react";
import {
    CalendarDays,
    Car,
    Check,
    ChevronDown,
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

const tripTypes = [
    "Family Trip",
    "Adventure",
    "Relaxed Vacation",
    "Road Trip",
    "Religious Trip",
    "Budget Trip",
];

const transportOptions = ["Any", "Train", "Flight", "Cab", "Bus", "Self Drive"];

const foodOptions = ["Vegetarian", "Non-Vegetarian", "Jain", "Any"];

const paceOptions = ["Relaxed", "Balanced", "Fast"];

export default function NewTripClient() {
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        setError(null);
        setIsLoading(true);

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
            setError(result.error);
            return;
        }

        router.push(`/dashboard/trips/${result.tripId}`);
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
                                placeholder="7"
                            />

                            <InputField
                                icon={<Users className="h-4 w-4" />}
                                label="People"
                                name="people"
                                type="number"
                                min="1"
                                placeholder="3"
                            />

                            <InputField
                                icon={<IndianRupee className="h-4 w-4" />}
                                label="Budget"
                                name="budget"
                                type="number"
                                min="0"
                                placeholder="70000"
                            />

                            <SelectField
                                icon={<Sparkles className="h-4 w-4" />}
                                label="Trip Type"
                                name="tripType"
                                options={tripTypes}
                                defaultValue="Family Trip"
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
                            <SelectField
                                icon={<Car className="h-4 w-4" />}
                                label="Transport"
                                name="transport"
                                options={transportOptions}
                                defaultValue="Any"
                            />

                            <SelectField
                                icon={<Utensils className="h-4 w-4" />}
                                label="Food Preference"
                                name="food"
                                options={foodOptions}
                                defaultValue="Any"
                            />

                            <SelectField
                                icon={<Route className="h-4 w-4" />}
                                label="Travel Pace"
                                name="pace"
                                options={paceOptions}
                                defaultValue="Balanced"
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
                                placeholder="Example: Need family-friendly hotels, avoid risky roads, include snow places, keep budget low..."
                                className="w-full resize-none rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground/70 hover:bg-input-hover focus:border-ring focus:ring-4 focus:ring-ring/20"
                            />
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
};

function InputField({
    icon,
    label,
    name,
    placeholder,
    type = "text",
    min,
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
                    placeholder={placeholder}
                    className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground/70"
                />
            </div>
        </div>
    );
}

type SelectFieldProps = {
    icon: React.ReactNode;
    label: string;
    name: string;
    options: string[];
    defaultValue: string;
};

function SelectField({
    icon,
    label,
    name,
    options,
    defaultValue,
}: SelectFieldProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(defaultValue);

    const selectedLabel = selectedValue || `Select ${label.toLowerCase()}`;

    return (
        <div className="relative">
            <label
                htmlFor={name}
                className="mb-2 block text-sm font-black text-foreground"
            >
                {label}
            </label>

            <input type="hidden" name={name} value={selectedValue} />

            <button
                id={name}
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${isOpen
                    ? "border-ring bg-input ring-4 ring-ring/20"
                    : "border-border bg-input hover:bg-input-hover"
                    }`}
            >
                <span className="text-secondary-foreground">{icon}</span>

                <span
                    className={`min-w-0 flex-1 truncate text-sm font-semibold ${selectedValue ? "text-foreground" : "text-muted-foreground/70"
                        }`}
                >
                    {selectedLabel}
                </span>

                <ChevronDown
                    className={`h-4 w-4 shrink-0 text-secondary-foreground transition ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </button>

            {isOpen && (
                <>
                    <button
                        type="button"
                        aria-label="Close dropdown"
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 z-10 cursor-default"
                    />

                    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-xl">
                        {options.map((option) => {
                            const isSelected = selectedValue === option;

                            return (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => {
                                        setSelectedValue(option);
                                        setIsOpen(false);
                                    }}
                                    className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 my-1 text-left text-sm font-bold transition ${isSelected
                                        ? "bg-selected text-selected-foreground"
                                        : "text-secondary-foreground hover:bg-secondary hover:text-foreground"
                                        }`}
                                >
                                    <span>{option}</span>

                                    {isSelected && <Check className="h-4 w-4" />}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}