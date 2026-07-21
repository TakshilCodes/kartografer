function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={"animate-pulse rounded-md bg-card-secondary/80 " + className}
    />
  );
}

function SectionSkeleton({
  rows = 3,
  columns = false,
}: {
  rows?: number;
  columns?: boolean;
}) {
  return (
    <section className="rounded-lg border border-border bg-card shadow-sm">
      <header className="flex items-start gap-4 rounded-t-lg border-b border-border bg-card-secondary/35 p-5 sm:p-6">
        <SkeletonBlock className="h-10 w-10 shrink-0 rounded-2xl bg-primary/25" />
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-6 w-44 max-w-full" />
          <SkeletonBlock className="h-4 w-96 max-w-full" />
        </div>
      </header>
      <div
        className={
          columns
            ? "grid gap-4 p-5 sm:grid-cols-3 sm:p-6"
            : "space-y-4 p-5 sm:p-6"
        }
      >
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className={columns ? "rounded-lg bg-card-secondary/35 p-4" : ""}
          >
            <SkeletonBlock className="h-4 w-32 max-w-full" />
            <SkeletonBlock className="mt-2 h-11 w-full rounded-2xl" />
            {!columns ? (
              <SkeletonBlock className="mt-2 h-3 w-64 max-w-[80%]" />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function SettingsLoading() {
  return (
    <div
      className="min-h-screen bg-dashboard px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
      aria-busy="true"
      aria-label="Loading settings"
    >
      <span className="sr-only">Loading your settings...</span>

      <div className="mx-auto w-full max-w-[1180px]">
        <header className="mb-6 space-y-3 border-b border-border pb-5">
          <SkeletonBlock className="h-3 w-32" />
          <SkeletonBlock className="h-9 w-40" />
          <SkeletonBlock className="h-4 w-136 max-w-[85vw]" />
        </header>

        <div className="space-y-6">
          <SectionSkeleton rows={3} columns />
          <SectionSkeleton rows={2} />
          <SectionSkeleton rows={3} columns />

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionSkeleton rows={3} />
            <SectionSkeleton rows={4} />
          </div>

          <section className="rounded-lg border border-danger/25 bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <SkeletonBlock className="h-10 w-10 shrink-0 rounded-2xl bg-danger/15" />
                <div className="min-w-0 flex-1 space-y-2">
                  <SkeletonBlock className="h-3 w-24 bg-danger/15" />
                  <SkeletonBlock className="h-6 w-36" />
                  <SkeletonBlock className="h-4 w-120 max-w-full" />
                </div>
              </div>
              <SkeletonBlock className="h-11 w-36 shrink-0 rounded-full bg-danger/15" />
            </div>
          </section>

          <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-44" />
              <SkeletonBlock className="h-3 w-80 max-w-full" />
            </div>
            <SkeletonBlock className="h-11 w-40 rounded-full bg-primary/25" />
          </div>
        </div>
      </div>
    </div>
  );
}
