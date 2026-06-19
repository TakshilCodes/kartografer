function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-card-secondary/80 ${className}`}
    />
  );
}

function TripCardSkeleton() {
  return (
    <article className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div
        className="relative h-36 overflow-hidden border-b border-border bg-card-secondary/70"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      >
        <div className="absolute inset-x-8 top-1/2 border-t-2 border-dashed border-primary/15" />
        <div className="absolute left-5 top-[42%] h-8 w-8 animate-pulse rounded-full bg-card" />
        <div className="absolute right-5 top-[42%] h-8 w-8 animate-pulse rounded-full bg-primary/25" />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-5 w-4/5" />
            <SkeletonBlock className="h-3 w-3/5" />
          </div>
          <SkeletonBlock className="h-6 w-18 shrink-0 rounded-full" />
        </div>

        <div className="mt-4 space-y-2">
          <SkeletonBlock className="h-3.5 w-full" />
          <SkeletonBlock className="h-3.5 w-3/4" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-y border-border py-3">
          <SkeletonBlock className="h-4 w-20" />
          <SkeletonBlock className="h-4 w-24" />
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-3 w-22" />
            <SkeletonBlock className="h-5 w-28" />
            <SkeletonBlock className="h-3 w-36 max-w-full" />
          </div>
          <SkeletonBlock className="h-6 w-16 rounded-full" />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <SkeletonBlock className="h-3 w-28" />
          <div className="flex gap-2">
            <SkeletonBlock className="h-9 w-16 rounded-full" />
            <SkeletonBlock className="h-9 w-16 rounded-full bg-primary/25" />
          </div>
        </div>
      </div>
    </article>
  );
}

export default function MyTripsLoading() {
  return (
    <div
      className="min-h-screen bg-dashboard px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
      aria-busy="true"
      aria-label="Loading trips"
    >
      <span className="sr-only">Loading your trips...</span>

      <div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-9 w-40" />
            <SkeletonBlock className="h-4 w-80 max-w-[80vw]" />
          </div>
          <SkeletonBlock className="h-11 w-28 rounded-full" />
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <TripCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
