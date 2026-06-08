"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import CustomSelect from "@/components/shared/CustomSelect";

export type MealSuggestion = {
  id: string;
  tripDayId: string;
  mealType: string;
  title: string;
  locationName: string | null;
  estimatedCost: string | null;
  notes: string | null;
};

export type MealFormValues = {
  mealType: string;
  title: string;
  locationName: string;
  estimatedCost: string;
  notes: string;
};

const MAX_TEXT_LENGTH = 250;

function limitCharacters(value: string, maxLength = MAX_TEXT_LENGTH) {
  return value.slice(0, maxLength);
}

const mealTypeOptions = [
  { label: "Breakfast", value: "BREAKFAST" },
  { label: "Lunch", value: "LUNCH" },
  { label: "Dinner", value: "DINNER" },
  { label: "Snack", value: "SNACK" },
  { label: "Other", value: "OTHER" },
];

type MealModalProps = {
  isOpen: boolean;
  isPending: boolean;
  error?: string;
  editingMeal: MealSuggestion | null;
  selectedDayNumber?: number;
  onClose: () => void;
  onSave: (values: MealFormValues) => void;
};

function getDefaultFormValues(): MealFormValues {
  return {
    mealType: "LUNCH",
    title: "",
    locationName: "",
    estimatedCost: "",
    notes: "",
  };
}

function getFormValuesFromMeal(meal: MealSuggestion): MealFormValues {
  return {
    mealType: meal.mealType,
    title: meal.title,
    locationName: meal.locationName ?? "",
    estimatedCost: meal.estimatedCost ?? "",
    notes: meal.notes ?? "",
  };
}

export default function MealModal({
  isOpen,
  isPending,
  error,
  editingMeal,
  selectedDayNumber,
  onClose,
  onSave,
}: MealModalProps) {
  const [form, setForm] = useState<MealFormValues>(getDefaultFormValues);
  const editingId = editingMeal?.id ?? "new";

  useEffect(() => {
    if (!isOpen) return;
    setForm(
      editingMeal ? getFormValuesFromMeal(editingMeal) : getDefaultFormValues()
    );
  }, [isOpen, editingId]);

  const notesLength = form.notes.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-3 sm:items-center">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close meal modal"
        className="absolute inset-0"
      />

      <div className="relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card-secondary/50 px-5 py-4">
          <div>
            <h2 className="text-base font-black text-foreground">
              {editingMeal ? "Edit meal" : "Add meal"}
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-secondary-foreground">
              Add meal for Day {selectedDayNumber ?? ""}.
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
          <CustomSelect
            label="Meal type"
            value={form.mealType}
            options={mealTypeOptions}
            onChange={(mealType) =>
              setForm((current) => ({ ...current, mealType }))
            }
          />

          <div>
            <label className="mb-2 block text-sm font-black text-foreground">
              Meal title
            </label>
            <input
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring"
              placeholder="Vegetarian Kashmiri thali"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-foreground">
              Location / restaurant
            </label>
            <input
              value={form.locationName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  locationName: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring"
              placeholder="Local restaurant near Dal Lake"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-foreground">
              Estimated cost
            </label>
            <input
              value={form.estimatedCost}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  estimatedCost: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring"
              placeholder="900"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-sm font-black text-foreground">
                Notes
              </label>

              <span
                className={`text-xs font-bold ${
                  notesLength >= MAX_TEXT_LENGTH
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
              placeholder="Any meal notes..."
            />
          </div>
        </div>

        <div className="shrink-0 border-t border-border bg-card p-5">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-full border border-border bg-card px-5 py-2.5 text-sm font-black text-foreground transition hover:bg-card-secondary"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={() => onSave(form)}
              className="cursor-pointer rounded-full bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending
                ? "Saving..."
                : editingMeal
                  ? "Save meal"
                  : "Add meal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
