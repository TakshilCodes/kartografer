"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Edit3, X } from "lucide-react";

import { updateTripBasicInfoAction } from "@/actions/trips/update-trip-basic-info.action";

type EditTripHeaderProps = {
  trip: {
    id: string;
    title: string;
    summary?: string | null;
    daysCount: number;
    peopleCount: number;
    budgetAmount: string | null;
  };
};

function formatCurrency(amount: string | null) {
  if (!amount) return "Not set";

  const value = Number(amount);

  if (Number.isNaN(value)) return "Not set";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function EditTripHeader({ trip }: EditTripHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(trip.title);
  const [summary, setSummary] = useState(trip.summary ?? "");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function openEditModal() {
    setTitle(trip.title);
    setSummary(trip.summary ?? "");
    setMessage("");
    setIsEditing(true);
  }

  function handleSave() {
    setMessage("");

    startTransition(async () => {
      const result = await updateTripBasicInfoAction({
        tripId: trip.id,
        title,
        summary,
      });

      setMessage(result.message);

      if (result.success) {
        setIsEditing(false);
      }
    });
  }

  return (
    <>
      <div className="border-b border-border bg-card px-4 py-3 sm:px-5 lg:px-6">
        <div className="flex w-full min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <Link
              href={`/dashboard/trips/${trip.id}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-dashboard text-secondary-foreground transition hover:bg-card-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-secondary-foreground">
                Trip editor
              </p>

              <button
                type="button"
                onClick={openEditModal}
                className="group flex max-w-full cursor-pointer items-start gap-2 text-left"
              >
                <h1 className="truncate text-xl font-black text-foreground sm:text-2xl">
                  {trip.title}
                </h1>
                <Edit3 className="h-4 w-4 shrink-0 text-secondary-foreground opacity-70 transition group-hover:text-primary group-hover:opacity-100" />
              </button>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <span className="rounded-full bg-card-secondary px-3 py-1.5 text-xs font-black text-secondary-foreground">
              {trip.daysCount} days
            </span>

            <span className="rounded-full bg-card-secondary px-3 py-1.5 text-xs font-black text-secondary-foreground">
              {trip.peopleCount} people
            </span>

            <span className="rounded-full bg-card-secondary px-3 py-1.5 text-xs font-black text-secondary-foreground">
              {formatCurrency(trip.budgetAmount)}
            </span>

            <button
              type="button"
              onClick={openEditModal}
              className="inline-flex items-center justify-center cursor-pointer gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground transition hover:bg-primary-hover"
            >
              <Edit3 className="h-4 w-4" />
              Edit info
            </button>
          </div>
        </div>
      </div>

      {isEditing ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-3 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-lg rounded-[28px] border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between rounded-t-[28px] gap-3 border-b border-border bg-card-secondary/50 px-5 py-4">
              <div>
                <h2 className="text-base font-black text-foreground">
                  Edit trip info
                </h2>
                <p className="mt-0.5 text-xs font-semibold text-secondary-foreground">
                  Update the title and summary shown across your trip.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex h-9 w-9 items-center justify-center cursor-pointer rounded-full border border-border bg-card text-foreground transition hover:bg-card-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-2 block text-sm font-black text-foreground">
                  Trip title
                </label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring"
                  placeholder="Example: 5-Day Kashmir Family Trip"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-foreground">
                  Trip summary
                </label>
                <textarea
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  rows={4}
                  className="w-full resize-none scrollbar-hide rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold leading-6 text-foreground outline-none transition focus:border-ring"
                  placeholder="Short overview of this trip..."
                />
                <p className="mt-1 text-xs font-semibold text-secondary-foreground">
                  This summary is shown in the trip preview, share page, and
                  export.
                </p>
              </div>

              {message ? (
                <p className="rounded-2xl bg-card-secondary px-4 py-3 text-sm font-bold text-secondary-foreground">
                  {message}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-black text-foreground transition hover:bg-card-secondary"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending}
                  className="inline-flex items-center justify-center cursor-pointer gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Check className="h-4 w-4" />
                  {isPending ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
