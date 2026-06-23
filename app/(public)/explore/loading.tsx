import { ExploreTripsGridSkeleton } from "@/components/explore/ExploreTripsGrid";

export default function ExploreLoading() {
  return (
    <div className="min-h-screen bg-background px-3 pb-12 pt-26 sm:px-5 lg:px-6 lg:pt-30">
      <div className="mx-auto max-w-330 space-y-5">
        <header className="px-1 sm:px-2">
          <div className="h-13 w-72 animate-pulse rounded-full bg-card-secondary sm:h-15 sm:w-96" />
          <div className="mt-4 h-4 w-full max-w-2xl animate-pulse rounded-full bg-card-secondary" />
          <div className="mt-2 h-4 w-2/3 max-w-xl animate-pulse rounded-full bg-card-secondary" />
        </header>

        <section className="rounded-[30px] border border-border bg-card/92 p-4 shadow-[0_18px_55px_rgba(81,49,23,0.08)]">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-9 w-9 animate-pulse rounded-full bg-card-secondary" />
            <div className="h-4 w-32 animate-pulse rounded-full bg-card-secondary" />
          </div>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.9fr)_150px_150px_150px_165px_auto]">
            {Array.from({ length: 7 }, (_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-3 w-18 animate-pulse rounded-full bg-card-secondary" />
                <div className="h-12 animate-pulse rounded-2xl bg-card-secondary" />
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-between px-1">
          <div className="h-4 w-28 animate-pulse rounded-full bg-card-secondary" />
          <div className="h-4 w-24 animate-pulse rounded-full bg-card-secondary" />
        </div>

        <ExploreTripsGridSkeleton />
      </div>
    </div>
  );
}