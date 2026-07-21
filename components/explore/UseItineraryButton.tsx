"use client";

import { useTransition, useState } from "react";

import { publicTripAsTemplateAction } from "@/actions/explore/use-template.action";

type UseItineraryButtonProps = {
  publicTripId: string;
};

export default function UseItineraryButton({
  publicTripId,
}: UseItineraryButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleClick() {
    setError("");

    startTransition(async () => {
      const result = await publicTripAsTemplateAction({ publicTripId });

      if (result?.ok === false) {
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-full bg-primary px-5 text-sm font-black text-primary-foreground shadow-lg shadow-primary/15 transition hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-70"
      >
        {isPending ? "Copying..." : "Use this itinerary"}
      </button>

      {error ? (
        <p className="mt-2 rounded-2xl border border-danger/20 bg-danger/10 px-3 py-2 text-xs font-bold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
