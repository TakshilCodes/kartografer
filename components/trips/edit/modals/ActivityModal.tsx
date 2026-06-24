"use client";

import { useState } from "react";
import { X } from "lucide-react";

import CustomSelect from "@/components/shared/CustomSelect";

export type TripActivity = {
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
  estimatedCost: string | null;
  notes: string | null;
  position: number;
};

export type ActivityFormValues = {
  title: string;
  description: string;
  locationName: string;
  address: string;
  startTime: string;
  endTime: string;
  durationMinutes: string;
  category: string;
  estimatedCost: string;
  notes: string;
};

const MAX_TEXT_LENGTH = 250;

function limitCharacters(value: string, maxLength = MAX_TEXT_LENGTH) {
  return value.slice(0, maxLength);
}

const activityCategoryOptions = [
  { label: "Sightseeing", value: "SIGHTSEEING" },
  { label: "Adventure", value: "ADVENTURE" },
  { label: "Food", value: "FOOD" },
  { label: "Shopping", value: "SHOPPING" },
  { label: "Relaxation", value: "RELAXATION" },
  { label: "Culture", value: "CULTURE" },
  { label: "Religious", value: "RELIGIOUS" },
  { label: "Nature", value: "NATURE" },
  { label: "Transport Break", value: "TRANSPORT_BREAK" },
  { label: "Hidden Spot", value: "HIDDEN_SPOT" },
  { label: "Other", value: "OTHER" },
];

type ActivityModalProps = {
  isOpen: boolean;
  isPending: boolean;
  error?: string;
  editingActivity: TripActivity | null;
  selectedDayNumber?: number;
  onClose: () => void;
  onSave: (values: ActivityFormValues) => void;
};

function getDefaultFormValues(): ActivityFormValues {
  return {
    title: "",
    description: "",
    locationName: "",
    address: "",
    startTime: "",
    endTime: "",
    durationMinutes: "",
    category: "SIGHTSEEING",
    estimatedCost: "",
    notes: "",
  };
}

function getFormValuesFromActivity(activity: TripActivity): ActivityFormValues {
  return {
    title: activity.title,
    description: activity.description ?? "",
    locationName: activity.locationName ?? "",
    address: activity.address ?? "",
    startTime: activity.startTime ?? "",
    endTime: activity.endTime ?? "",
    durationMinutes: activity.durationMinutes?.toString() ?? "",
    category: activity.category,
    estimatedCost: activity.estimatedCost ?? "",
    notes: activity.notes ?? "",
  };
}

export default function ActivityModal({
  isOpen,
  isPending,
  error,
  editingActivity,
  selectedDayNumber,
  onClose,
  onSave,
}: ActivityModalProps) {
  if (!isOpen) return null;

  const editingId = editingActivity?.id ?? "new";

  return (
    <ActivityModalInner
      key={editingId}
      isPending={isPending}
      error={error}
      editingActivity={editingActivity}
      selectedDayNumber={selectedDayNumber}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function ActivityModalInner({
  isPending,
  error,
  editingActivity,
  selectedDayNumber,
  onClose,
  onSave,
}: Omit<ActivityModalProps, "isOpen">) {
  const [form, setForm] = useState<ActivityFormValues>(() =>
    editingActivity
      ? getFormValuesFromActivity(editingActivity)
      : getDefaultFormValues()
  );

  const descriptionLength = form.description.length;
  const notesLength = form.notes.length;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-3 sm:items-center">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close activity modal"
        className="absolute inset-0"
      />

      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card-secondary/50 px-5 py-4">
          <div>
            <h2 className="text-base font-black text-foreground">
              {editingActivity ? "Edit activity" : "Add activity"}
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-secondary-foreground">
              Add activity for Day {selectedDayNumber ?? ""}.
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
              Activity title
            </label>
            <input
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
              className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring"
              placeholder="Shikara Ride"
            />
          </div>

          <CustomSelect
            label="Category"
            value={form.category}
            options={activityCategoryOptions}
            onChange={(category) =>
              setForm((current) => ({ ...current, category }))
            }
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-black text-foreground">
                Location name
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
                placeholder="Dal Lake"
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
                placeholder="1200"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-foreground">
              Address
            </label>
            <input
              value={form.address}
              onChange={(event) =>
                setForm((current) => ({ ...current, address: event.target.value }))
              }
              className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring"
              placeholder="Optional address / area"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-black text-foreground">
                Start time
              </label>
              <input
                value={form.startTime}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    startTime: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring"
                placeholder="09:00"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-foreground">
                End time
              </label>
              <input
                value={form.endTime}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    endTime: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring"
                placeholder="10:30"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-foreground">
                Duration mins
              </label>
              <input
                value={form.durationMinutes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    durationMinutes: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring"
                placeholder="90"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-sm font-black text-foreground">
                Description
              </label>

              <span
                className={`text-xs font-bold ${
                  descriptionLength >= MAX_TEXT_LENGTH
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
              placeholder="Short activity details..."
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
              placeholder="Any activity notes..."
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
                : editingActivity
                  ? "Save activity"
                  : "Add activity"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
