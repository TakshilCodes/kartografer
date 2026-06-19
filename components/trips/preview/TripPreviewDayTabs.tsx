"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type TripPreviewDayTabsProps = {
  days: {
    id: string;
    dayNumber: number;
    title: string;
  }[];
  selectedDayId: string;
  onSelectDay: (day: {
    id: string;
    dayNumber: number;
    title: string;
  }) => void;
};

export default function TripPreviewDayTabs({
  days,
  selectedDayId,
  onSelectDay,
}: TripPreviewDayTabsProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  function scrollLeft() {
    scrollRef.current?.scrollBy({
      left: -360,
      behavior: "smooth",
    });
  }

  function scrollRight() {
    scrollRef.current?.scrollBy({
      left: 360,
      behavior: "smooth",
    });
  }

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-border bg-card/70 p-3 shadow-sm">
      <button
        type="button"
        onClick={scrollLeft}
        className="absolute left-4 top-1/2 z-20 hidden cursor-pointer h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/95 text-foreground shadow-md backdrop-blur transition hover:scale-105 hover:bg-card-hover lg:flex"
        aria-label="Scroll days left"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="pointer-events-none absolute bottom-3 left-0 top-3 z-10 w-10 bg-linear-to-r from-card via-card/90 to-transparent sm:w-16 lg:w-24" />
      <div className="pointer-events-none absolute bottom-3 right-0 top-3 z-10 w-10 bg-linear-to-l from-card via-card/90 to-transparent sm:w-16 lg:w-24" />

      <div
        ref={scrollRef}
        className="scrollbar-hide flex gap-3 overflow-x-auto scroll-smooth px-1 lg:px-16"
      >
        {days.map((day) => {
          const isSelected = day.id === selectedDayId;

          return (
            <button
              key={day.id}
              type="button"
              onClick={() => onSelectDay(day)}
              className={`h-20 w-52 shrink-0 rounded-2xl border px-4 py-3 text-left transition cursor-pointer ${isSelected
                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                  : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-card-hover"
                }`}
            >
              <p className="text-sm font-black">Day {day.dayNumber}</p>

              <p
                className={`mt-1 line-clamp-1 text-xs font-semibold ${isSelected
                    ? "text-primary-foreground/85"
                    : "text-secondary-foreground"
                  }`}
              >
                {day.title}
              </p>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={scrollRight}
        className="absolute right-4 top-1/2 z-20 hidden cursor-pointer h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/95 text-foreground shadow-md backdrop-blur transition hover:scale-105 hover:bg-card-hover lg:flex"
        aria-label="Scroll days right"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
