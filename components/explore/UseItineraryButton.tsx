"use client";

import { useState, useTransition } from "react";
import { CopyPlus } from "lucide-react";

import { usePublicTripAsTemplateAction } from "@/actions/explore/use-template.action";

export default function UseItineraryButton({ publicTripId }: { publicTripId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleUseTemplate() {
    setError("");

    startTransition(async () => {
      const result = await usePublicTripAsTemplateAction({ publicTripId });

      if (result && !result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleUseTemplate}
        disabled={isPending}
        className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-black text-primary-foreground shadow-lg shadow-primary/15 transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        <CopyPlus className="h-4 w-4" />
        {isPending ? "Copying itinerary..." : "Use This Itinerary"}
      </button>

      {error ? (
        <p className="mt-2 rounded-2xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-bold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}