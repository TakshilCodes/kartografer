"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Pencil, Sparkles } from "lucide-react";

import { generateTripItineraryAction } from "@/actions/trips/generate-trip-itinerary.action";

type EmptyTripRecoveryProps = {
  tripId: string;
};

export default function EmptyTripRecovery({ tripId }: EmptyTripRecoveryProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleRetryGeneration() {
    setError("");

    startTransition(async () => {
      const result = await generateTripItineraryAction({
        tripId,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-warning/10 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-warning text-warning-foreground">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-secondary-foreground">
              Empty itinerary
            </p>

            <h2 className="mt-1 text-xl font-black text-foreground">
              This trip does not have an itinerary yet
            </h2>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <p className="max-w-3xl text-sm font-semibold leading-6 text-secondary-foreground">
          AI generation may have failed because the model was busy or the trip
          was too large. You can retry generation or continue editing manually.
        </p>

        {error ? (
          <div className="mt-4 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-bold leading-6 text-danger">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={isPending}
            onClick={handleRetryGeneration}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isPending ? "Generating itinerary..." : "Retry AI Generation"}
          </button>

          <Link
            href={`/dashboard/trips/${tripId}/edit`}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-black text-foreground transition hover:bg-card-secondary"
          >
            <Pencil className="h-4 w-4" />
            Edit Manually
          </Link>
        </div>
      </div>
    </section>
  );
}
