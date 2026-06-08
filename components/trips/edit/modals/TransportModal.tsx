"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import CustomSelect from "@/components/shared/CustomSelect";

export type TransportOption = {
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

export type TransportFormValues = {
    title: string;
    mode: string;
    fromText: string;
    toText: string;
    description: string;
    costType: string;
    pricePerPerson: string;
    totalCost: string;
    notes: string;
};

const transportModeOptions = [
    { label: "Flight", value: "FLIGHT" },
    { label: "Train", value: "TRAIN" },
    { label: "Bus", value: "BUS" },
    { label: "Cab", value: "CAB" },
    { label: "Self Drive", value: "SELF_DRIVE" },
    { label: "Walk", value: "WALK" },
    { label: "Bike", value: "BIKE" },
    { label: "Ferry", value: "FERRY" },
    { label: "Metro", value: "METRO" },
    { label: "Mixed", value: "MIXED" },
    { label: "Other", value: "OTHER" },
];

const costTypeOptions = [
    { label: "Total", value: "TOTAL" },
    { label: "Per person", value: "PER_PERSON" },
];

type TransportModalProps = {
    isOpen: boolean;
    isPending: boolean;
    error?: string;
    editingTransport: TransportOption | null;
    selectedDayNumber?: number;
    onClose: () => void;
    onSave: (values: TransportFormValues) => void;
};

const MAX_TEXT_LENGTH = 250;

function limitCharacters(value: string, maxLength = MAX_TEXT_LENGTH) {
    return value.slice(0, maxLength);
}

function getDefaultFormValues(): TransportFormValues {
    return {
        title: "",
        mode: "CAB",
        fromText: "",
        toText: "",
        description: "",
        costType: "TOTAL",
        pricePerPerson: "",
        totalCost: "",
        notes: "",
    };
}

function getFormValuesFromTransport(transport: TransportOption): TransportFormValues {
    return {
        title: transport.title,
        mode: transport.mode,
        fromText: transport.fromText ?? "",
        toText: transport.toText ?? "",
        description: transport.description ?? "",
        costType: transport.costType,
        pricePerPerson: transport.pricePerPerson ?? "",
        totalCost: transport.totalCost ?? "",
        notes: transport.notes ?? "",
    };
}

export default function TransportModal({
    isOpen,
    isPending,
    error,
    editingTransport,
    selectedDayNumber,
    onClose,
    onSave,
}: TransportModalProps) {
    const [form, setForm] = useState<TransportFormValues>(getDefaultFormValues);
    const editingId = editingTransport?.id ?? "new";

    useEffect(() => {
        if (!isOpen) return;
        setForm(
            editingTransport
                ? getFormValuesFromTransport(editingTransport)
                : getDefaultFormValues()
        );
    }, [isOpen, editingId]);

    const descriptionLength = form.description.length;
    const notesLength = form.notes.length;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-3 sm:items-center">
            <button
                type="button"
                onClick={onClose}
                aria-label="Close transport modal"
                className="absolute inset-0"
            />

            <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl">
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card-secondary/50 px-5 py-4">
                    <div>
                        <h2 className="text-base font-black text-foreground">
                            {editingTransport ? "Edit transport" : "Add transport"}
                        </h2>
                        <p className="mt-0.5 text-xs font-semibold text-secondary-foreground">
                            Add transport for Day {selectedDayNumber ?? ""}.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:bg-card-secondary"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {error ? (
                    <div className="shrink-0 border-b border-danger/20 bg-danger/10 px-5 py-3 text-sm font-bold text-danger">
                        {error}
                    </div>
                ) : null}

                <div className="flex-1 space-y-4 overflow-y-auto p-5 scrollbar-none [&::-webkit-scrollbar]:hidden">
                    <div>
                        <label className="mb-2 block text-sm font-black text-foreground">
                            Transport title
                        </label>
                        <input
                            value={form.title}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    title: event.target.value,
                                }))
                            }
                            className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring"
                            placeholder="Flight: Ahmedabad to Srinagar"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <CustomSelect
                            label="Mode"
                            value={form.mode}
                            options={transportModeOptions}
                            onChange={(mode) =>
                                setForm((current) => ({ ...current, mode }))
                            }
                        />

                        <CustomSelect
                            label="Cost type"
                            value={form.costType}
                            options={costTypeOptions}
                            onChange={(costType) =>
                                setForm((current) => ({ ...current, costType }))
                            }
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-black text-foreground">
                                From
                            </label>
                            <input
                                value={form.fromText}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        fromText: event.target.value,
                                    }))
                                }
                                className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring"
                                placeholder="Ahmedabad"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-black text-foreground">
                                To
                            </label>
                            <input
                                value={form.toText}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        toText: event.target.value,
                                    }))
                                }
                                className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring"
                                placeholder="Srinagar"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <label className="block text-sm font-black text-foreground">
                                Description
                            </label>

                            <span
                                className={`text-xs font-bold ${descriptionLength >= MAX_TEXT_LENGTH
                                    ? "text-danger"
                                    : "text-secondary-foreground"
                                    }`}
                            >
                                {descriptionLength}/{MAX_TEXT_LENGTH}
                            </span>
                        </div>

                        <textarea
                            value={form.description}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    description: limitCharacters(event.target.value),
                                }))
                            }
                            rows={2}
                            maxLength={MAX_TEXT_LENGTH}
                            className="w-full resize-none rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold leading-6 text-foreground outline-none transition focus:border-ring"
                            placeholder="Short transport details..."
                        />

                        {descriptionLength >= MAX_TEXT_LENGTH ? (
                            <p className="mt-1 text-xs font-bold text-danger">
                                Description cannot be more than {MAX_TEXT_LENGTH} characters.
                            </p>
                        ) : null}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-black text-foreground">
                            {form.costType === "PER_PERSON"
                                ? "Price per person"
                                : "Total cost"}
                        </label>
                        <input
                            value={
                                form.costType === "PER_PERSON"
                                    ? form.pricePerPerson
                                    : form.totalCost
                            }
                            onChange={(event) => {
                                if (form.costType === "PER_PERSON") {
                                    setForm((current) => ({
                                        ...current,
                                        pricePerPerson: event.target.value,
                                    }));
                                } else {
                                    setForm((current) => ({
                                        ...current,
                                        totalCost: event.target.value,
                                    }));
                                }
                            }}
                            className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring"
                            placeholder="1200"
                        />
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between gap-3">
                            <label className="block text-sm font-black text-foreground">
                                Notes
                            </label>

                            <span
                                className={`text-xs font-bold ${notesLength >= MAX_TEXT_LENGTH
                                        ? "text-danger"
                                        : "text-secondary-foreground"
                                    }`}
                            >
                                {notesLength}/{MAX_TEXT_LENGTH}
                            </span>
                        </div>

                        <textarea
                            value={form.notes}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    notes: limitCharacters(event.target.value),
                                }))
                            }
                            rows={2}
                            maxLength={MAX_TEXT_LENGTH}
                            className="w-full resize-none rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold leading-6 text-foreground outline-none transition focus:border-ring"
                            placeholder="Any transport notes..."
                        />

                        {notesLength >= MAX_TEXT_LENGTH ? (
                            <p className="mt-1 text-xs font-bold text-danger">
                                Notes cannot be more than {MAX_TEXT_LENGTH} characters.
                            </p>
                        ) : null}
                    </div>
                </div>

                <div className="shrink-0 border-t border-border bg-card p-5">
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-black text-foreground transition cursor-pointer hover:bg-card-secondary"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            disabled={isPending}
                            onClick={() => onSave(form)}
                            className="rounded-full bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground transition cursor-pointer hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isPending
                                ? "Saving..."
                                : editingTransport
                                    ? "Save transport"
                                    : "Add transport"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
