"use client";

import { useEffect, useState } from "react";

import ExploreTripCard from "@/components/explore/ExploreTripCard";

const EXPLORE_LOADING_EVENT = "kartografer:explore-loading";

export function triggerExploreGridLoading() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(EXPLORE_LOADING_EVENT));
}

export function ExploreTripsGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm"
        >
          <div className="h-44 animate-pulse border-b border-border bg-card-secondary" />
          <div className="space-y-4 p-4">
            <div className="h-3 w-24 animate-pulse rounded-full bg-card-secondary" />
            <div className="space-y-2">
              <div className="h-5 w-4/5 animate-pulse rounded-full bg-card-secondary" />
              <div className="h-5 w-2/3 animate-pulse rounded-full bg-card-secondary" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded-full bg-card-secondary" />
              <div className="h-3 w-3/4 animate-pulse rounded-full bg-card-secondary" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="h-13 animate-pulse rounded-2xl bg-card-secondary" />
              <div className="h-13 animate-pulse rounded-2xl bg-card-secondary" />
              <div className="h-13 animate-pulse rounded-2xl bg-card-secondary" />
            </div>
            <div className="flex gap-2">
              <div className="h-7 w-20 animate-pulse rounded-full bg-card-secondary" />
              <div className="h-7 w-16 animate-pulse rounded-full bg-card-secondary" />
            </div>
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div className="h-3 w-22 animate-pulse rounded-full bg-card-secondary" />
              <div className="h-9 w-28 animate-pulse rounded-full bg-card-secondary" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ExploreTripsGrid({
  trips,
  hasFilters,
}: {
  trips: React.ComponentProps<typeof ExploreTripCard>["trip"][];
  hasFilters: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    function handleExploreLoading() {
      setIsLoading(true);
    }

    window.addEventListener(EXPLORE_LOADING_EVENT, handleExploreLoading);

    return () => {
      window.removeEventListener(EXPLORE_LOADING_EVENT, handleExploreLoading);
    };
  }, []);

  useEffect(() => {
    setIsLoading(false);
  }, [trips]);

  if (isLoading) {
    return <ExploreTripsGridSkeleton />;
  }

  if (trips.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-border bg-card p-10 text-center shadow-sm">
        <h2 className="text-2xl font-black text-foreground">
          {hasFilters ? "No matching trips" : "No public trips yet"}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-secondary-foreground">
          {hasFilters
            ? "Try changing your search or clearing some filters."
            : "Published itineraries will appear here once users start sharing them."}
        </p>
        {hasFilters ? (
          <a
            href="/explore"
            onClick={triggerExploreGridLoading}
            className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground transition hover:bg-primary-hover"
          >
            Clear filters
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {trips.map((trip) => (
        <ExploreTripCard key={trip.id} trip={trip} />
      ))}
    </div>
  );
}