function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-card-secondary/70 ${className}`}
    />
  );
}

export default function TripPreviewLoading() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background px-3 py-4 sm:px-5 lg:px-6">
      <div className="mx-auto w-full max-w-345 space-y-5">
        <header className="flex flex-col gap-3 rounded-[28px] border border-border bg-card px-4 py-4 shadow-sm sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <SkeletonBox className="h-10 w-10 rounded-full" />

            <div>
              <SkeletonBox className="mb-2 h-5 w-28" />
              <SkeletonBox className="h-7 w-64 max-w-[70vw]" />
            </div>
          </div>

          <div className="flex gap-2">
            <SkeletonBox className="h-10 w-28 rounded-full" />
            <SkeletonBox className="h-10 w-36 rounded-full" />
          </div>
        </header>

        <section className="relative overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
          <div className="absolute inset-0 opacity-[0.5]">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(84,55,29,0.075)_1px,transparent_1px),linear-gradient(to_bottom,rgba(84,55,29,0.075)_1px,transparent_1px)] bg-size-[34px_34px]" />
          </div>

          <div className="relative p-5 sm:p-6 lg:p-7">
            <SkeletonBox className="mb-5 h-5 w-40" />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-center">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)] sm:items-center">
                  <SkeletonBox className="h-28 rounded-3xl" />
                  <div className="hidden h-px border-t-2 border-dashed border-border sm:block" />
                  <SkeletonBox className="h-28 rounded-3xl" />
                </div>

                <SkeletonBox className="h-4 w-full" />
                <SkeletonBox className="h-4 w-3/4" />

                <div className="flex flex-wrap gap-2">
                  <SkeletonBox className="h-8 w-20 rounded-full" />
                  <SkeletonBox className="h-8 w-24 rounded-full" />
                  <SkeletonBox className="h-8 w-28 rounded-full" />
                  <SkeletonBox className="h-8 w-24 rounded-full" />
                </div>
              </div>

              <SkeletonBox className="h-48 rounded-3xl" />
            </div>
          </div>
        </section>

        <main className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-5">
            <section className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm">
              <div className="border-b border-border bg-card-secondary/40 px-4 py-4 sm:px-5">
                <div className="mb-4 flex gap-2 overflow-hidden">
                  <SkeletonBox className="h-20 min-w-42.5" />
                  <SkeletonBox className="h-20 min-w-42.5" />
                  <SkeletonBox className="h-20 min-w-42.5" />
                </div>

                <SkeletonBox className="mb-2 h-4 w-28" />
                <SkeletonBox className="h-7 w-72 max-w-full" />
              </div>

              <div className="p-4 sm:p-5">
                <div className="mb-5 rounded-3xl border border-border bg-card-secondary/30 p-4">
                  <div className="grid gap-3 sm:grid-cols-4">
                    <SkeletonBox className="h-24" />
                    <SkeletonBox className="h-24" />
                    <SkeletonBox className="h-24" />
                    <SkeletonBox className="h-24" />
                  </div>
                </div>

                <div className="space-y-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="relative grid gap-3 sm:grid-cols-[48px_minmax(0,1fr)]"
                    >
                      <div className="relative hidden justify-center sm:flex">
                        <SkeletonBox className="h-10 w-10 rounded-full" />
                      </div>

                      <div className="overflow-hidden rounded-[22px] border border-border bg-card shadow-sm">
                        <div className="grid sm:grid-cols-[130px_minmax(0,1fr)]">
                          <div className="border-b border-border bg-card-secondary/55 px-4 py-3 sm:border-b-0 sm:border-r">
                            <SkeletonBox className="mb-2 h-7 w-20" />
                            <SkeletonBox className="h-4 w-24" />
                            <SkeletonBox className="mt-4 h-6 w-16 rounded-full" />
                          </div>

                          <div className="px-4 py-3.5">
                            <SkeletonBox className="mb-2 h-5 w-64 max-w-full" />
                            <SkeletonBox className="mb-2 h-4 w-full" />
                            <SkeletonBox className="h-4 w-2/3" />

                            <div className="mt-3 flex flex-wrap gap-2">
                              <SkeletonBox className="h-7 w-28 rounded-full" />
                              <SkeletonBox className="h-7 w-24 rounded-full" />
                              <SkeletonBox className="h-7 w-20 rounded-full" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <aside className="min-w-0 space-y-5">
            <SkeletonBox className="h-80 rounded-[28px]" />
            <SkeletonBox className="h-36 rounded-[28px]" />
            <SkeletonBox className="h-36 rounded-[28px]" />
            <SkeletonBox className="h-40 rounded-[28px]" />
          </aside>
        </main>
      </div>
    </div>
  );
}