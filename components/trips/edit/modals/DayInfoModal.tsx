"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

export type DayInfoFormValues = {
  dayTitle: string;
  dayDescription: string;
  dayNotes: string;
};

type DayInfoModalProps = {
  isOpen: boolean;
  isPending: boolean;
  error?: string;
  dayNumber?: number;
  initialValues: DayInfoFormValues | null;
  onClose: () => void;
  onSave: (values: DayInfoFormValues) => void;
};

const emptyValues: DayInfoFormValues = {
  dayTitle: "",
  dayDescription: "",
  dayNotes: "",
};

export default function DayInfoModal({
  isOpen,
  isPending,
  error,
  dayNumber,
  initialValues,
  onClose,
  onSave,
}: DayInfoModalProps) {
  const [form, setForm] = useState<DayInfoFormValues>(
    () => initialValues ?? emptyValues,
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-3 sm:items-center">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close day info modal"
        className="absolute inset-0"
      />

      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card-secondary/50 px-5 py-4">
          <div>
            <h2 className="text-base font-black text-foreground">
              Edit Day {dayNumber ?? ""}
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-secondary-foreground">
              Update the selected day title, description, and notes.
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
              Day title
            </label>
            <input
              value={form.dayTitle}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  dayTitle: event.target.value,
                }))
              }
              className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring"
              placeholder="Example: Ahmedabad to Srinagar Arrival"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-foreground">
              Day description
            </label>
            <textarea
              value={form.dayDescription}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  dayDescription: event.target.value,
                }))
              }
              rows={3}
              className="w-full resize-none rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold leading-6 text-foreground outline-none transition focus:border-ring"
              placeholder="Short description of this day..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-foreground">
              Day notes
            </label>
            <textarea
              value={form.dayNotes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  dayNotes: event.target.value,
                }))
              }
              rows={3}
              className="w-full resize-none rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold leading-6 text-foreground outline-none transition focus:border-ring"
              placeholder="Any important notes for this day..."
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
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Check className="h-4 w-4" />
              {isPending ? "Saving..." : "Save day"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
