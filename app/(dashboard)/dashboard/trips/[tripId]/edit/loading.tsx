import {
  ArrowLeft,
  Bot,
  Check,
  IndianRupee,
  Route,
  Sparkles,
} from "lucide-react";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-card-secondary/80 ${className}`}
    />
  );
}

function PanelShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-[26px] border border-border bg-card shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

function OptionCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-dashboard p-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonBlock className="h-4 w-28" />
          <SkeletonBlock className="h-3 w-36" />
          <SkeletonBlock className="h-3 w-16" />
        </div>

        <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-primary/25" />
      </div>
    </div>
  );
}

function ItemCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-dashboard px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 gap-3">
          <div className="mt-0.5 h-8 w-8 shrink-0 animate-pulse rounded-full bg-card-secondary" />

          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-48" />
            <SkeletonBlock className="h-3 w-full" />
            <SkeletonBlock className="h-3 w-2/3" />
          </div>
        </div>

        <SkeletonBlock className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

function SectionSkeleton({ cards = 2 }: { cards?: number }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 animate-pulse rounded-full bg-card-secondary" />
          <SkeletonBlock className="h-4 w-36" />
        </div>

        <SkeletonBlock className="h-8 w-24 rounded-full" />
      </div>

      <div className="space-y-2">
        {Array.from({ length: cards }).map((_, index) => (
          <ItemCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}

export default function EditTripLoading() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-dashboard pb-20 xl:pb-0">
      <div className="border-b border-border bg-card px-4 py-3 sm:px-5 lg:px-6">
        <div className="mx-auto flex max-w-400 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-dashboard text-secondary-foreground">
              <ArrowLeft className="h-4 w-4" />
            </div>

            <div className="min-w-0 space-y-2">
              <SkeletonBlock className="h-3 w-28" />
              <SkeletonBlock className="h-6 w-64 max-w-full" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SkeletonBlock className="h-8 w-20 rounded-full" />
            <SkeletonBlock className="h-8 w-24 rounded-full" />
            <SkeletonBlock className="h-8 w-24 rounded-full" />

            <div className="inline-flex items-center justify-center gap-2 rounded-full bg-primary/70 px-5 py-2.5 text-sm font-black text-primary-foreground">
              <Check className="h-4 w-4" />
              Loading
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-400 gap-4 p-4 sm:p-5 lg:p-6 xl:h-[calc(100vh-92px)] xl:grid-cols-[300px_minmax(0,1fr)_330px] xl:overflow-hidden">
        <aside className="hidden min-h-0 min-w-0 xl:block xl:h-full xl:overflow-hidden">
          <PanelShell className="flex h-full min-h-0 flex-col overflow-hidden">
            <div className="shrink-0 border-b border-border bg-card-secondary/50 px-4 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <div className="space-y-2">
                  <SkeletonBlock className="h-4 w-28" />
                  <SkeletonBlock className="h-3 w-44" />
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden p-3">
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, groupIndex) => (
                  <div key={groupIndex}>
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-4 w-4 animate-pulse rounded-full bg-primary/25" />
                      <SkeletonBlock className="h-3 w-24" />
                    </div>

                    <div className="space-y-2">
                      {Array.from({ length: groupIndex === 0 ? 3 : 2 }).map(
                        (_, cardIndex) => (
                          <OptionCardSkeleton key={cardIndex} />
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </PanelShell>
        </aside>

        <main className="min-h-0 min-w-0 space-y-4 xl:h-full xl:overflow-y-auto xl:pr-1 scrollbar-none [&::-webkit-scrollbar]:hidden">
          <PanelShell className="overflow-hidden">
            <div className="border-b border-border bg-card-secondary/50 px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-primary" />
                    <SkeletonBlock className="h-3 w-36" />
                  </div>

                  <SkeletonBlock className="h-6 w-72 max-w-full" />
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-130">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-border bg-card px-3 py-2.5"
                    >
                      <SkeletonBlock className="h-3 w-16" />
                      <SkeletonBlock className="mt-2 h-4 w-20" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PanelShell>

          <PanelShell className="p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="space-y-2">
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock className="h-3 w-48" />
              </div>

              <SkeletonBlock className="h-8 w-24 rounded-full" />
            </div>

            <div className="flex gap-2 overflow-hidden pb-1">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="min-w-45 rounded-2xl border border-border bg-dashboard px-4 py-3"
                >
                  <SkeletonBlock className="h-4 w-16" />
                  <SkeletonBlock className="mt-2 h-3 w-28" />
                </div>
              ))}
            </div>
          </PanelShell>

          <PanelShell className="overflow-hidden">
            <div className="border-b border-border bg-card-secondary/50 px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <SkeletonBlock className="h-3 w-44" />
                  <SkeletonBlock className="h-8 w-80 max-w-full" />
                  <SkeletonBlock className="h-4 w-full max-w-2xl" />
                  <SkeletonBlock className="h-4 w-full max-w-xl" />
                </div>

                <SkeletonBlock className="h-9 w-28 rounded-full" />
              </div>
            </div>

            <div className="space-y-5 p-4 sm:p-5">
              <SectionSkeleton cards={2} />
              <SectionSkeleton cards={1} />

              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 animate-pulse rounded-full bg-card-secondary" />
                    <SkeletonBlock className="h-4 w-20" />
                  </div>

                  <SkeletonBlock className="h-8 w-20 rounded-full" />
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-border bg-dashboard px-3 py-3"
                    >
                      <SkeletonBlock className="h-3 w-20" />
                      <SkeletonBlock className="mt-2 h-4 w-44" />
                    </div>
                  ))}
                </div>
              </section>

              <SectionSkeleton cards={2} />

              <section className="grid gap-4 lg:grid-cols-2">
                {Array.from({ length: 2 }).map((_, sectionIndex) => (
                  <div key={sectionIndex}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 animate-pulse rounded-full bg-card-secondary" />
                        <SkeletonBlock className="h-4 w-32" />
                      </div>

                      <SkeletonBlock className="h-8 w-20 rounded-full" />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <SkeletonBlock
                          key={index}
                          className="h-8 w-28 rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </section>

              <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="rounded-2xl border border-border bg-dashboard p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <SkeletonBlock className="h-4 w-24" />
                    <SkeletonBlock className="h-4 w-4 rounded-full" />
                  </div>

                  <div className="space-y-2">
                    <SkeletonBlock className="h-3 w-full" />
                    <SkeletonBlock className="h-3 w-5/6" />
                    <SkeletonBlock className="h-3 w-2/3" />
                  </div>
                </div>

                <div className="rounded-2xl bg-primary/25 p-4">
                  <SkeletonBlock className="h-3 w-28 bg-primary/20" />
                  <SkeletonBlock className="mt-2 h-7 w-32 bg-primary/20" />
                </div>
              </section>
            </div>
          </PanelShell>
        </main>

        <aside className="hidden min-h-0 min-w-0 xl:block xl:h-full xl:overflow-hidden">
          <PanelShell className="flex h-full min-h-0 flex-col overflow-hidden">
            <div className="shrink-0 border-b border-border bg-card-secondary/50 px-4 py-4">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                <div className="space-y-2">
                  <SkeletonBlock className="h-4 w-28" />
                  <SkeletonBlock className="h-3 w-40" />
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-hidden p-3">
              <div className="flex justify-start">
                <SkeletonBlock className="h-20 w-[85%]" />
              </div>

              <div className="flex justify-end">
                <SkeletonBlock className="h-14 w-[72%] bg-primary/20" />
              </div>

              <div className="flex justify-start">
                <SkeletonBlock className="h-24 w-[85%]" />
              </div>

              <div className="rounded-2xl border border-dashed border-border bg-card-secondary/40 p-3">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-4 w-4 animate-pulse rounded-full bg-primary/25" />
                  <SkeletonBlock className="h-3 w-28" />
                </div>

                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <SkeletonBlock key={index} className="h-9 w-full" />
                  ))}
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-border bg-card p-3">
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-dashboard px-3 py-2">
                <SkeletonBlock className="h-5 flex-1" />
                <div className="h-9 w-9 animate-pulse rounded-full bg-primary/25" />
              </div>
            </div>
          </PanelShell>
        </aside>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card shadow-[0_-6px_24px_rgba(31,20,8,0.08)] xl:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between px-2 pb-[env(safe-area-inset-bottom)]">
          {[
            ["Options", <Sparkles key="options" className="h-5 w-5" />],
            ["Plan", <Route key="plan" className="h-5 w-5" />],
            ["AI Chat", <Bot key="ai" className="h-5 w-5" />],
          ].map(([label, icon]) => (
            <div
              key={String(label)}
              className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-2 py-2"
            >
              <span className="flex h-6 w-6 items-center justify-center text-secondary-foreground">
                {icon}
              </span>

              <span className="truncate text-[11px] font-bold leading-none text-secondary-foreground">
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="mx-auto mb-1 h-1 w-16 rounded-full bg-foreground/30" />
      </footer>
    </div>
  );
}