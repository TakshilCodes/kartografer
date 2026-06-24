"use client";

import { useEffect, useMemo, useState } from "react";

type QuickItineraryOverviewProps = {
  days: Array<{
    id: string;
    dayNumber: number;
    title: string;
  }>;
};

export default function QuickItineraryOverview({ days }: QuickItineraryOverviewProps) {
  const [activeDay, setActiveDay] = useState(days[0]?.dayNumber ?? 1);
  const dayNumbers = useMemo(() => days.map((day) => day.dayNumber), [days]);

  useEffect(() => {
    if (dayNumbers.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const firstVisible = visibleEntries[0];
        const dayNumber = Number(firstVisible?.target.getAttribute("data-day-number"));

        if (dayNumber && dayNumbers.includes(dayNumber)) {
          setActiveDay(dayNumber);
        }
      },
      {
        root: null,
        rootMargin: "-24% 0px -62% 0px",
        threshold: [0.05, 0.15, 0.3, 0.55],
      }
    );

    dayNumbers.forEach((dayNumber) => {
      const element = document.getElementById(`day-${dayNumber}`);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [dayNumbers]);

  function handleDayClick(dayNumber: number) {
    setActiveDay(dayNumber);
    document.getElementById(`day-${dayNumber}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  if (days.length === 0) return null;

  return (
    <nav className="rounded-[28px] border border-border bg-card p-5 shadow-sm" aria-label="Day plan overview">
      <h2 className="text-lg font-black text-foreground">Day Plan</h2>
      <div className="mt-4">
        <div className="relative space-y-1">
          <div className="absolute bottom-4 left-2 top-4 w-px -translate-x-1/2 bg-border" />
          {days.map((day) => {
            const isActive = day.dayNumber === activeDay;

            return (
              <button
                key={day.id}
                type="button"
                onClick={() => handleDayClick(day.dayNumber)}
                className="group relative grid w-full cursor-pointer grid-cols-[1rem_minmax(0,1fr)] items-center gap-3 py-1 text-left"
              >
                <span className="relative flex h-4 w-4 items-center justify-center">
                  <span
                    className={`relative z-10 h-2.5 w-2.5 rounded-full border transition ${
                      isActive
                        ? "border-primary bg-card ring-4 ring-primary/20"
                        : "border-border bg-muted-foreground group-hover:bg-primary"
                    }`}
                  />
                </span>
                <span
                  className={`min-w-0 flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-black transition ${
                    isActive
                      ? "bg-primary/12 text-primary shadow-sm ring-1 ring-primary/20"
                      : "text-secondary-foreground group-hover:bg-card-secondary group-hover:text-foreground"
                  }`}
                >
                  <span className="shrink-0">Day {day.dayNumber}</span>
                  <span className={`min-w-0 truncate text-xs font-bold ${isActive ? "text-primary/85" : "text-muted-foreground"}`}>
                    {day.title}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}