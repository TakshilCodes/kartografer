import {
  CalendarDays,
  Clock3,
  IndianRupee,
  Route,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-card-secondary/80 ${className}`}
    />
  );
}

function MiniStatSkeleton({
  icon,
}: {
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card/80 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
          {icon}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-4 w-28" />
        </div>
      </div>
    </div>
  );
}

function DaySkeleton({ index }: { index: number }) {
  return (
    <div
      className="rounded-[1.4rem] border border-border bg-dashboard/70 p-3"
      style={{
        animationDelay: `${index * 70}ms`,
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-2xl bg-primary/25" />

          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-20" />
            <SkeletonBlock className="h-3 w-32" />
          </div>
        </div>

        <SkeletonBlock className="h-6 w-16 rounded-full" />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_230px]">
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, activityIndex) => (
            <div
              key={activityIndex}
              className="grid grid-cols-[70px_1fr] gap-3 rounded-2xl bg-card/85 p-3 shadow-sm"
            >
              <SkeletonBlock className="h-4 w-12" />

              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-40" />
                <SkeletonBlock className="h-3 w-full" />
                <SkeletonBlock className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-2.5">
          {Array.from({ length: 3 }).map((_, cardIndex) => (
            <div
              key={cardIndex}
              className="rounded-2xl bg-card/85 p-3 shadow-sm"
            >
              <div className="mb-2 flex items-center gap-2">
                <SkeletonBlock className="h-4 w-4 rounded-full" />
                <SkeletonBlock className="h-4 w-28" />
              </div>

              <div className="space-y-2">
                <SkeletonBlock className="h-3 w-full" />
                <SkeletonBlock className="h-3 w-2/3" />
                <SkeletonBlock className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TripPreviewLoading() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-dashboard px-4 py-5 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -top-28 right-10 h-72 w-72 rounded-full bg-selected/30 blur-3xl" />
      <div className="pointer-events-none absolute left-0 top-96 h-80 w-80 rounded-full bg-secondary/50 blur-3xl" />

      <div className="relative mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SkeletonBlock className="h-10 w-32 rounded-full" />

          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-9 w-20 rounded-full" />
            <SkeletonBlock className="h-10 w-28 rounded-full" />
          </div>
        </div>

        <section className="overflow-hidden rounded-[1.7rem] border border-border/80 bg-card/75 shadow-sm backdrop-blur-xl">
          <div className="relative p-5 sm:p-7 lg:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--selected),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.65),transparent)] opacity-40" />

            <div className="relative grid gap-6 lg:grid-cols-[1fr_300px] lg:items-end">
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-selected/70 px-3 py-1.5 text-xs font-black text-selected-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                    Loading trip
                  </div>

                  <SkeletonBlock className="h-7 w-20 rounded-full" />
                </div>

                <div className="space-y-3">
                  <SkeletonBlock className="h-10 w-full max-w-2xl" />
                  <SkeletonBlock className="h-10 w-full max-w-xl" />
                </div>

                <div className="mt-4 space-y-2">
                  <SkeletonBlock className="h-4 w-full max-w-3xl" />
                  <SkeletonBlock className="h-4 w-full max-w-2xl" />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <SkeletonBlock
                      key={index}
                      className="h-8 w-24 rounded-full"
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-[1.4rem] border border-border bg-card/75 p-4 shadow-sm backdrop-blur">
                <div className="mb-3 flex items-center gap-2">
                  <Route className="h-4 w-4 text-primary" />
                  <SkeletonBlock className="h-4 w-28" />
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <SkeletonBlock className="h-3 w-12" />
                    <SkeletonBlock className="h-4 w-36" />
                  </div>

                  <div className="h-px bg-border" />

                  <div className="space-y-2">
                    <SkeletonBlock className="h-3 w-8" />
                    <SkeletonBlock className="h-4 w-40" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MiniStatSkeleton icon={<CalendarDays className="h-4 w-4" />} />
          <MiniStatSkeleton icon={<Users className="h-4 w-4" />} />
          <MiniStatSkeleton icon={<IndianRupee className="h-4 w-4" />} />
          <MiniStatSkeleton icon={<Clock3 className="h-4 w-4" />} />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <section className="rounded-[1.7rem] border border-border/80 bg-card/75 p-4 shadow-sm backdrop-blur-xl sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="space-y-2">
                <SkeletonBlock className="h-5 w-40" />
                <SkeletonBlock className="h-4 w-64" />
              </div>

              <SkeletonBlock className="hidden h-8 w-28 rounded-full sm:block" />
            </div>

            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <DaySkeleton key={index} index={index} />
              ))}
            </div>
          </section>

          <div className="space-y-5">
            <section className="rounded-[1.7rem] border border-border/80 bg-card/75 p-4 shadow-sm backdrop-blur-xl sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" />
                <SkeletonBlock className="h-5 w-28" />
              </div>

              <div className="space-y-2.5">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-2xl bg-card-secondary/80 px-4 py-3"
                  >
                    <SkeletonBlock className="h-4 w-20" />
                    <SkeletonBlock className="h-4 w-24" />
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl bg-primary/25 p-4">
                <SkeletonBlock className="h-3 w-20 bg-primary/20" />
                <SkeletonBlock className="mt-2 h-7 w-36 bg-primary/20" />
              </div>
            </section>

            <section className="rounded-[1.7rem] border border-border/80 bg-card/75 p-4 shadow-sm backdrop-blur-xl sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <SkeletonBlock className="h-5 w-28" />
              </div>

              <div className="grid gap-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <SkeletonBlock key={index} className="h-11 w-full" />
                ))}
              </div>

              <SkeletonBlock className="mt-4 h-12 w-full rounded-2xl" />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}