function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={"animate-pulse rounded-md bg-card-secondary/80 " + className}
    />
  );
}

export default function ProfileLoading() {
  return (
    <div
      className="min-h-screen bg-dashboard px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
      aria-busy="true"
      aria-label="Loading profile"
    >
      <span className="sr-only">Loading your profile...</span>

      <div className="mx-auto w-full max-w-[1240px] space-y-6">
        <header className="space-y-3 border-b border-border pb-5">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-9 w-36" />
          <SkeletonBlock className="h-4 w-120 max-w-[85vw]" />
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)] lg:items-start">
          <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="h-36 bg-primary/85 p-5">
              <SkeletonBlock className="h-8 w-40 rounded-full bg-primary-foreground/15" />
            </div>
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
              <SkeletonBlock className="-mt-14 h-24 w-24 shrink-0 rounded-full border-4 border-card bg-card-secondary" />
              <div className="min-w-0 flex-1 space-y-3 sm:pt-3">
                <SkeletonBlock className="h-7 w-44" />
                <SkeletonBlock className="h-4 w-72 max-w-full" />
                <SkeletonBlock className="h-4 w-36" />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="space-y-3 border-b border-border pb-4">
              <SkeletonBlock className="h-3 w-28" />
              <SkeletonBlock className="h-6 w-40" />
              <SkeletonBlock className="h-4 w-full" />
            </div>
            <div className="mt-5 space-y-4">
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="h-12 w-full rounded-2xl" />
              <SkeletonBlock className="h-11 w-36 rounded-full bg-primary/25" />
            </div>
          </section>
        </div>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="rounded-lg border border-border bg-card p-4 shadow-sm"
            >
              <SkeletonBlock className="h-9 w-9 rounded-2xl" />
              <SkeletonBlock className="mt-5 h-7 w-14" />
              <SkeletonBlock className="mt-2 h-3 w-20 max-w-full" />
            </div>
          ))}
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
            <div className="space-y-2">
              <SkeletonBlock className="h-5 w-28" />
              <SkeletonBlock className="h-3 w-48" />
            </div>
            <SkeletonBlock className="h-9 w-24 rounded-full" />
          </div>
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="flex items-center gap-4 rounded-lg bg-card-secondary/35 p-4"
              >
                <SkeletonBlock className="h-10 w-10 shrink-0 rounded-2xl" />
                <div className="min-w-0 flex-1 space-y-2">
                  <SkeletonBlock className="h-4 w-48 max-w-full" />
                  <SkeletonBlock className="h-3 w-64 max-w-[80%]" />
                </div>
                <SkeletonBlock className="h-8 w-8 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}