"use client";

import { useState } from "react";
import { X } from "lucide-react";

import CustomSelect from "@/components/shared/CustomSelect";

export type StayOption = {
  id: string;
  tripDayId: string | null;
  name: string;
  city: string | null;
  area: string | null;
  stayType: string;
  budgetLevel: string;
  pricePerNight: string | null;
  nights: number | null;
  totalCost: string | null;
  isSelected: boolean;
  bestFor: string | null;
  notes: string | null;
};

export type StayFormValues = {
  name: string;
  city: string;
  area: string;
  stayType: string;
  budgetLevel: string;
  pricePerNight: string;
  nights: string;
  totalCost: string;
  bestFor: string;
  notes: string;
};

const MAX_TEXT_LENGTH = 250;

function limitCharacters(value: string, maxLength = MAX_TEXT_LENGTH) {
  return value.slice(0, maxLength);
}

const stayTypeOptions = [
  { label: "Hotel", value: "HOTEL" },
  { label: "Resort", value: "RESORT" },
  { label: "Homestay", value: "HOMESTAY" },
  { label: "Houseboat", value: "HOUSEBOAT" },
  { label: "Hostel", value: "HOSTEL" },
  { label: "Villa", value: "VILLA" },
  { label: "Camp", value: "CAMP" },
  { label: "Guest House", value: "GUEST_HOUSE" },
  { label: "Other", value: "OTHER" },
];

const budgetLevelOptions = [
  { label: "Budget", value: "BUDGET" },
  { label: "Mid Range", value: "MID_RANGE" },
  { label: "Premium", value: "PREMIUM" },
  { label: "Luxury", value: "LUXURY" },
];

type StayModalProps = {
  isOpen: boolean;
  isPending: boolean;
  error?: string;
  editingStay: StayOption | null;
  selectedDayNumber?: number;
  onClose: () => void;
  onSave: (values: StayFormValues) => void;
};

function getDefaultFormValues(): StayFormValues {
  return {
    name: "",
    city: "",
    area: "",
    stayType: "HOTEL",
    budgetLevel: "MID_RANGE",
    pricePerNight: "",
    nights: "",
    totalCost: "",
    bestFor: "",
    notes: "",
  };
}

function getFormValuesFromStay(stay: StayOption): StayFormValues {
  return {
    name: stay.name,
    city: stay.city ?? "",
    area: stay.area ?? "",
    stayType: stay.stayType,
    budgetLevel: stay.budgetLevel,
    pricePerNight: stay.pricePerNight ?? "",
    nights: stay.nights?.toString() ?? "",
    totalCost: stay.totalCost ?? "",
    bestFor: stay.bestFor ?? "",
    notes: stay.notes ?? "",
  };
}

export default function StayModal({
  isOpen,
  isPending,
  error,
  editingStay,
  selectedDayNumber,
  onClose,
  onSave,
}: StayModalProps) {
  if (!isOpen) return null;

  const editingId = editingStay?.id ?? "new";

  return (
    <StayModalInner
      key={editingId}
      isPending={isPending}
      error={error}
      editingStay={editingStay}
      selectedDayNumber={selectedDayNumber}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function StayModalInner({
  isPending,
  error,
  editingStay,
  selectedDayNumber,
  onClose,
  onSave,
}: Omit<StayModalProps, "isOpen">) {
  const [form, setForm] = useState<StayFormValues>(() =>
    editingStay ? getFormValuesFromStay(editingStay) : getDefaultFormValues(),
  );

  const bestForLength = form.bestFor.length;
  const notesLength = form.notes.length;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-3 sm:items-center">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close stay modal"
        className="absolute inset-0"
      />

      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card-secondary/50 px-5 py-4">
          <div>
            <h2 className="text-base font-black text-foreground">
              {editingStay ? "Edit stay" : "Add stay"}
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-secondary-foreground">
              Add stay for Day {selectedDayNumber ?? ""}.
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
              Stay name
            </label>
            <input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring"
              placeholder="Houseboat near Dal Lake"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-black text-foreground">
                City
              </label>
              <input
                value={form.city}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    city: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring"
                placeholder="Srinagar"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-foreground">
                Area
              </label>
              <input
                value={form.area}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    area: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring"
                placeholder="Dal Lake"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <CustomSelect
              label="Stay type"
              value={form.stayType}
              options={stayTypeOptions}
              onChange={(stayType) =>
                setForm((current) => ({ ...current, stayType }))
              }
            />

            <CustomSelect
              label="Budget level"
              value={form.budgetLevel}
              options={budgetLevelOptions}
              onChange={(budgetLevel) =>
                setForm((current) => ({ ...current, budgetLevel }))
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-black text-foreground">
                Price/night
              </label>
              <input
                value={form.pricePerNight}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    pricePerNight: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring"
                placeholder="5500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-foreground">
                Nights
              </label>
              <input
                value={form.nights}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    nights: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring"
                placeholder="1"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-black text-foreground">
                Total cost
              </label>
              <input
                value={form.totalCost}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    totalCost: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring"
                placeholder="5500"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-sm font-black text-foreground">
                Best for
              </label>

              <span
                className={`text-xs font-bold ${
                  bestForLength >= MAX_TEXT_LENGTH
                    ? "text-danger"
                    : "text-secondary-foreground"
                }`}
              >
                {bestForLength}/{MAX_TEXT_LENGTH}
              </span>
            </div>

            <textarea
              value={form.bestFor}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  bestFor: limitCharacters(event.target.value),
                }))
              }
              rows={2}
              maxLength={MAX_TEXT_LENGTH}
              className="w-full resize-none rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold leading-6 text-foreground outline-none transition focus:border-ring"
              placeholder="Family-friendly, scenic views, close to main area..."
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
              placeholder="Any stay notes..."
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
              {isPending ? "Saving..." : editingStay ? "Save stay" : "Add stay"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
