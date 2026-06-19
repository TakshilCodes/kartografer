"use client";

import { useState } from "react";
import {
  BedDouble,
  Car,
  Compass,
  IndianRupee,
  Map,
  MapPin,
  Route,
  Utensils,
} from "lucide-react";

import TripPreviewDayTabs from "@/components/trips/preview/TripPreviewDayTabs";
import type { PreviewDayPanel } from "@/lib/trips/build-preview-day-panels";

type PublicCostSummary = {
  transport: string;
  stay: string;
  food: string;
  activities: string;
  total: string;
  budget: string | null;
  status: string | null;
};

type PublicTripPreviewProps = {
  trip: {
    title: string;
    summary: string | null;
    fromName: string;
    fromDetails: string | null;
    toName: string;
    toDetails: string | null;
    daysCount: number;
    peopleCount: number;
    tripType: string;
    travelPace: string;
    transportPreference: string;
    foodPreference: string;
  };
  dayPanels: PreviewDayPanel[];
  costSummary: PublicCostSummary | null;
};

function Surface({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-[28px] border border-border bg-card shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-card-secondary px-3 py-1.5 text-xs font-black text-secondary-foreground">
      {children}
    </span>
  );
}

function CostRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-secondary-foreground">{label}</span>
      <span className="shrink-0 text-sm font-black text-foreground">
        {value}
      </span>
    </div>
  );
}

export default function PublicTripPreview({
  trip,
  dayPanels,
  costSummary,
}: PublicTripPreviewProps) {
  const [selectedDayId, setSelectedDayId] = useState(
    dayPanels[0]?.dayId ?? ""
  );
  const selectedDay =
    dayPanels.find((day) => day.dayId === selectedDayId) ?? dayPanels[0];
  const tabDays = dayPanels.map((day) => ({
    id: day.dayId,
    dayNumber: day.dayNumber,
    title: day.tabTitle,
  }));

  return (
    <div className="min-h-screen overflow-x-hidden bg-background px-3 py-4 sm:px-5 lg:px-6">
      <div className="mx-auto w-full max-w-330 space-y-5">
        <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-primary">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Map className="h-4 w-4" />
              </span>
              Kartografer
            </div>
            <h1 className="wrap-break-word text-2xl font-black text-foreground sm:text-4xl">
              {trip.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary-foreground">
              {trip.summary ?? "A shared travel itinerary from Kartografer."}
            </p>
          </div>

          <span className="w-fit rounded-full border border-border bg-card-secondary px-3 py-2 text-xs font-black text-secondary-foreground">
            Read-only shared trip
          </span>
        </header>

        <Surface className="relative overflow-hidden p-5 sm:p-6">
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
              backgroundSize: "34px 34px",
            }}
          />

          <div className="relative">
            <div className="mb-5 flex items-center gap-2 text-sm font-black text-primary">
              <Route className="h-4 w-4" />
              Journey overview
            </div>

            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_80px_minmax(0,1fr)] sm:items-center">
              <div className="min-w-0 rounded-2xl border border-border bg-dashboard p-4">
                <p className="text-xs font-bold text-secondary-foreground">
                  Starting point
                </p>
                <div className="mt-2 flex min-w-0 items-start gap-2">
                  <MapPin className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-xl font-black text-foreground">
                      {trip.fromName}
                    </p>
                    {trip.fromDetails ? (
                      <p className="mt-1 line-clamp-1 text-xs text-secondary-foreground">
                        {trip.fromDetails}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="hidden border-t-2 border-dashed border-primary/40 sm:block" />

              <div className="min-w-0 rounded-2xl border border-border bg-dashboard p-4">
                <p className="text-xs font-bold text-secondary-foreground">
                  Destination
                </p>
                <div className="mt-2 flex min-w-0 items-start gap-2">
                  <MapPin className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-xl font-black text-foreground">
                      {trip.toName}
                    </p>
                    {trip.toDetails ? (
                      <p className="mt-1 line-clamp-1 text-xs text-secondary-foreground">
                        {trip.toDetails}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{trip.daysCount} days</Badge>
              <Badge>{trip.peopleCount} travelers</Badge>
              <Badge>{trip.tripType}</Badge>
              <Badge>{trip.travelPace} pace</Badge>
            </div>
          </div>
        </Surface>

        {selectedDay ? (
          <main className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <Surface className="min-w-0 overflow-hidden">
              <div className="border-b border-border bg-card-secondary/40 p-4 sm:p-5">
                <TripPreviewDayTabs
                  days={tabDays}
                  selectedDayId={selectedDay.dayId}
                  onSelectDay={(day) => setSelectedDayId(day.id)}
                />

                <p className="mt-5 flex items-center gap-2 text-xs font-black text-secondary-foreground">
                  <Route className="h-3.5 w-3.5 text-primary" />
                  Day route
                </p>
                <h2 className="mt-1 text-xl font-black text-foreground">
                  {selectedDay.displayTitle}
                </h2>
                {selectedDay.description ? (
                  <p className="mt-1 text-sm leading-6 text-secondary-foreground">
                    {selectedDay.description}
                  </p>
                ) : null}
              </div>

              <div className="space-y-3 p-4 sm:p-5">
                {selectedDay.routePreviewItems.length > 0 ? (
                  selectedDay.routePreviewItems.map((item, index) => (
                    <article
                      key={item.id}
                      className="grid overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-[105px_minmax(0,1fr)]"
                    >
                      <div className="border-b border-border bg-card-secondary/55 p-3 sm:border-b-0 sm:border-r">
                        <p className="text-lg font-black text-primary">
                          {item.time}
                        </p>
                        <p className="text-xs font-bold text-secondary-foreground">
                          {item.period}
                        </p>
                        <span className="mt-2 inline-flex rounded-full bg-card px-2 py-1 text-[10px] font-black text-secondary-foreground">
                          {index + 1}. {item.type}
                        </span>
                      </div>

                      <div className="min-w-0 p-3.5">
                        <h3 className="wrap-break-word text-base font-black text-foreground">
                          {item.title}
                        </h3>
                        <p className="mt-1 wrap-break-word text-sm leading-5 text-secondary-foreground">
                          {item.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-dashboard px-2.5 py-1 text-[11px] font-bold text-secondary-foreground">
                            <MapPin className="h-3 w-3 text-primary" />
                            {item.location || "Location not set"}
                          </span>
                          <span className="rounded-full bg-selected/60 px-2.5 py-1 text-[11px] font-black text-selected-foreground">
                            {item.tag}
                          </span>
                          <span className="rounded-full bg-card-secondary px-2.5 py-1 text-[11px] font-black text-primary">
                            {item.cost}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-card-secondary/30 p-5 text-sm text-secondary-foreground">
                    No selected itinerary items for this day.
                  </div>
                )}
              </div>
            </Surface>

            <aside className="space-y-5 xl:sticky xl:top-4 xl:h-fit">
              {costSummary ? (
                <Surface className="overflow-hidden">
                  <div className="border-b border-border bg-card-secondary/50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-primary" />
                      <h2 className="text-sm font-black text-foreground">
                        Estimated trip cost
                      </h2>
                    </div>
                  </div>
                  <div className="space-y-3 p-4">
                    <CostRow label="Transport" value={costSummary.transport} />
                    <CostRow label="Stay" value={costSummary.stay} />
                    <CostRow label="Food" value={costSummary.food} />
                    <CostRow label="Activities" value={costSummary.activities} />
                    <div className="border-t border-dashed border-border pt-3">
                      <CostRow label="Estimated total" value={costSummary.total} />
                    </div>
                    {costSummary.budget ? (
                      <CostRow label="Planned budget" value={costSummary.budget} />
                    ) : null}
                    {costSummary.status ? (
                      <p className="rounded-full bg-card-secondary px-3 py-2 text-center text-xs font-black text-secondary-foreground">
                        {costSummary.status}
                      </p>
                    ) : null}
                  </div>
                </Surface>
              ) : null}

              <Surface className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <BedDouble className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-black text-foreground">Stay</h2>
                </div>
                <p className="text-sm font-black text-foreground">
                  {selectedDay.suggestedStay?.name ?? "No stay selected"}
                </p>
                <p className="mt-1 text-xs leading-5 text-secondary-foreground">
                  {selectedDay.suggestedStay?.description ??
                    "No selected stay for this day."}
                </p>
                <p className="mt-2 text-xs font-black text-primary">
                  {selectedDay.suggestedStay?.costLabel ?? "Cost not set"}
                </p>
              </Surface>

              <Surface className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Car className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-black text-foreground">
                    Transport
                  </h2>
                </div>
                <p className="text-sm font-black text-foreground">
                  {selectedDay.suggestedTransport?.title ??
                    "No transport selected"}
                </p>
                <p className="mt-1 text-xs leading-5 text-secondary-foreground">
                  {selectedDay.suggestedTransport?.description ??
                    "No selected transport for this day."}
                </p>
              </Surface>

              <Surface className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Utensils className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-black text-foreground">
                    Food plan
                  </h2>
                </div>
                <div className="space-y-2">
                  {selectedDay.meals.length > 0 ? (
                    selectedDay.meals.map((meal) => (
                      <div
                        key={meal.id}
                        className="rounded-2xl bg-card-secondary/60 px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-black text-secondary-foreground">
                            {meal.mealTypeLabel}
                          </p>
                          <p className="text-[11px] font-black text-primary">
                            {meal.costLabel}
                          </p>
                        </div>
                        <p className="mt-1 text-xs font-bold text-foreground">
                          {meal.title}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-secondary-foreground">
                      No selected meals for this day.
                    </p>
                  )}
                </div>
              </Surface>

              <Surface className="bg-primary p-4 text-primary-foreground">
                <div className="mb-3 flex items-center gap-2">
                  <Compass className="h-4 w-4" />
                  <h2 className="text-sm font-black">Travel preferences</h2>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="flex justify-between gap-3">
                    <span className="opacity-75">Transport</span>
                    <span className="font-black">{trip.transportPreference}</span>
                  </p>
                  <p className="flex justify-between gap-3">
                    <span className="opacity-75">Food</span>
                    <span className="font-black">{trip.foodPreference}</span>
                  </p>
                </div>
              </Surface>
            </aside>
          </main>
        ) : (
          <Surface className="p-8 text-center">
            <h2 className="text-xl font-black text-foreground">
              This shared trip has no itinerary yet
            </h2>
            <p className="mt-2 text-sm text-secondary-foreground">
              The owner has not added selected itinerary items.
            </p>
          </Surface>
        )}
      </div>
    </div>
  );
}
