"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BedDouble,
  Binoculars,
  Car,
  Church,
  Compass,
  Landmark,
  MapPin,
  Mountain,
  Plus,
  Route,
  ShoppingBag,
  Sparkles,
  TreePalm,
  Utensils,
  Waves,
} from "lucide-react";

import type { PreviewDayPanel } from "@/lib/trips/build-preview-day-panels";
import TripPreviewDayTabs from "@/components/trips/preview/TripPreviewDayTabs";

type TripPreviewDayPanelProps = {
  tripId: string;
  dayPanels: PreviewDayPanel[];
  initialDayNumber: number;
  costSidebar: React.ReactNode;
};

function getActivityIcon(category: string) {
  switch (category) {
    case "SIGHTSEEING":
      return Binoculars;
    case "ADVENTURE":
      return Mountain;
    case "FOOD":
      return Utensils;
    case "SHOPPING":
      return ShoppingBag;
    case "RELAXATION":
      return Waves;
    case "CULTURE":
      return Landmark;
    case "RELIGIOUS":
      return Church;
    case "NATURE":
      return TreePalm;
    case "TRANSPORT_BREAK":
      return Car;
    case "HIDDEN_SPOT":
      return Compass;
    default:
      return Sparkles;
  }
}

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

function EmptyRouteState({ tripId }: { tripId: string }) {
  return (
    <div className="rounded-[28px] border border-dashed border-border bg-card-secondary/40 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-black text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            No itinerary items added yet
          </p>

          <p className="mt-1 max-w-2xl text-xs leading-5 text-secondary-foreground">
            Add transport, meals, and activities in the editor. Your real trip
            preview will appear here automatically.
          </p>
        </div>

        <Link
          href={`/dashboard/trips/${tripId}/edit`}
          className="inline-flex w-fit cursor-pointer items-center justify-center rounded-full bg-primary px-4 py-2 text-xs font-black text-primary-foreground transition hover:bg-primary-hover"
        >
          Start editing
        </Link>
      </div>
    </div>
  );
}

export default function TripPreviewDayPanel({
  tripId,
  dayPanels,
  initialDayNumber,
  costSidebar,
}: TripPreviewDayPanelProps) {
  const pathname = usePathname();
  const initialPanel =
    dayPanels.find((panel) => panel.dayNumber === initialDayNumber) ??
    dayPanels[0];

  const [selectedDayId, setSelectedDayId] = useState(initialPanel?.dayId ?? "");

  const selectedPanel =
    dayPanels.find((panel) => panel.dayId === selectedDayId) ?? dayPanels[0];

  function handleSelectDay(day: {
    id: string;
    dayNumber: number;
    title: string;
  }) {
    setSelectedDayId(day.id);

    const nextUrl = `${pathname}?day=${day.dayNumber}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }

  if (!selectedPanel) {
    return null;
  }

  const tabDays = dayPanels.map((panel) => ({
    id: panel.dayId,
    dayNumber: panel.dayNumber,
    title: panel.tabTitle,
  }));

  const routePreviewItems = selectedPanel.routePreviewItems;

  return (
    <main className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-5">
        <Surface className="overflow-hidden bg-card">
          <div className="border-b border-border bg-card-secondary/40 px-4 py-4 sm:px-5">
            <TripPreviewDayTabs
              days={tabDays}
              selectedDayId={selectedPanel.dayId}
              onSelectDay={handleSelectDay}
            />

            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-secondary-foreground">
                  <Route className="h-3.5 w-3.5 text-primary" />
                  Day route
                </p>

                <h2 className="mt-1 text-xl font-black text-foreground">
                  {selectedPanel.displayTitle}
                </h2>

                <p className="mt-1 text-xs font-semibold text-secondary-foreground">
                  {selectedPanel.description ??
                    "Transport first, then breakfast/lunch, then activities, then dinner/snacks."}
                </p>
              </div>

              <Link
                href={`/dashboard/trips/${tripId}/edit`}
                className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-card px-4 py-2 text-xs font-black text-primary shadow-sm transition hover:-translate-y-0.5 hover:bg-secondary"
              >
                <Plus className="h-4 w-4" />
                Add activity
              </Link>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            {routePreviewItems.length > 0 ? (
              <>
                <div className="mb-5 rounded-3xl border border-border bg-card-secondary/30 p-4">
                  <div className="grid gap-3 sm:grid-cols-4">
                    {routePreviewItems.slice(0, 4).map((item, index) => (
                      <div
                        key={`mini-${item.id}`}
                        className="relative rounded-2xl border border-border bg-card px-3 py-3 shadow-sm"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground">
                            {index + 1}
                          </span>

                          <span className="text-[11px] font-black text-primary">
                            {item.time}
                          </span>
                        </div>

                        <p className="line-clamp-1 text-xs font-black text-foreground">
                          {item.period}
                        </p>

                        <p className="mt-0.5 line-clamp-1 text-[11px] font-semibold text-secondary-foreground">
                          {item.location}
                        </p>

                        {index !== routePreviewItems.slice(0, 4).length - 1 ? (
                          <div className="absolute -right-3 top-1/2 hidden h-px w-6 border-t-2 border-dashed border-primary/40 sm:block" />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <div className="space-y-4">
                    {routePreviewItems.map((item, index) => {
                      const isLast = index === routePreviewItems.length - 1;
                      const ActivityIcon =
                        item.itemKind === "activity"
                          ? getActivityIcon(
                              item.activityCategory?.toUpperCase() ?? ""
                            )
                          : item.itemKind === "meal"
                            ? Utensils
                            : Route;

                      return (
                        <div
                          key={item.id}
                          className="relative grid gap-3 sm:grid-cols-[48px_minmax(0,1fr)]"
                        >
                          <div className="relative hidden justify-center sm:flex">
                            <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-xs font-black text-primary shadow-sm">
                              {index + 1}
                            </div>

                            {!isLast ? (
                              <div className="absolute left-1/2 top-10 h-[calc(100%+16px)] w-px -translate-x-1/2 bg-border" />
                            ) : null}
                          </div>

                          <div className="group relative overflow-hidden rounded-[22px] border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
                            <div className="absolute inset-y-0 left-0 hidden w-1 bg-primary/80 sm:block" />

                            <div className="grid sm:grid-cols-[130px_minmax(0,1fr)]">
                              <div className="border-b border-border bg-card-secondary/55 px-4 py-3 sm:border-b-0 sm:border-r">
                                <div className="flex items-start justify-between gap-3 sm:block">
                                  <div className="flex items-center gap-3 sm:block">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-xs font-black text-primary shadow-sm sm:hidden">
                                      {index + 1}
                                    </div>

                                    <div>
                                      <p className="text-2xl font-black leading-none text-primary">
                                        {item.time}
                                      </p>

                                      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-secondary-foreground">
                                        {item.period}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="mt-0 flex w-fit items-center gap-1 rounded-full bg-card px-2.5 py-1 text-[10px] font-black text-secondary-foreground sm:mt-4">
                                    <ActivityIcon className="h-3 w-3 text-primary" />
                                    {item.type}
                                  </div>
                                </div>
                              </div>

                              <div className="min-w-0 px-4 py-3.5">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="min-w-0">
                                    <h3 className="wrap-break-word text-[15px] font-black leading-6 text-foreground">
                                      {item.title}
                                    </h3>

                                    <p className="mt-1 wrap-break-word text-[13px] leading-5 text-secondary-foreground">
                                      {item.description}
                                    </p>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-dashboard px-2.5 py-1 text-[11px] font-bold text-secondary-foreground">
                                        <MapPin className="h-3.5 w-3.5 text-primary" />
                                        {item.location || "No location"}
                                      </span>

                                      <span className="rounded-full bg-selected/60 px-2.5 py-1 text-[11px] font-black text-selected-foreground">
                                        {item.tag}
                                      </span>

                                      <span className="rounded-full bg-card-secondary px-2.5 py-1 text-[11px] font-black text-primary">
                                        {item.cost}
                                      </span>
                                    </div>
                                  </div>

                                  <Link
                                    href={`/dashboard/trips/${tripId}/edit`}
                                    className="inline-flex h-fit w-fit shrink-0 cursor-pointer items-center rounded-full border border-border bg-dashboard px-3 py-1.5 text-[11px] font-black text-foreground transition hover:bg-card-secondary sm:opacity-0 sm:group-hover:opacity-100"
                                  >
                                    Edit
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <EmptyRouteState tripId={tripId} />
            )}
          </div>
        </Surface>
      </div>

      <aside className="min-w-0 space-y-5 xl:sticky xl:top-4 xl:h-fit">
        {costSidebar}

        <Surface className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-primary" />

            <h2 className="text-sm font-black text-foreground">Stay</h2>
          </div>

          <p className="text-sm font-black text-foreground">
            {selectedPanel.suggestedStay?.name ?? "No stay selected yet"}
          </p>

          <p className="mt-1 text-xs leading-5 text-secondary-foreground">
            {selectedPanel.suggestedStay?.description ??
              "No stay selected yet."}
          </p>

          <p className="mt-2 text-xs font-black text-primary">
            {selectedPanel.suggestedStay?.costLabel ?? "Cost not set"}
          </p>
        </Surface>

        <Surface className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Car className="h-4 w-4 text-primary" />

            <h2 className="text-sm font-black text-foreground">
              Local transport
            </h2>
          </div>

          <p className="text-sm font-black text-foreground">
            {selectedPanel.suggestedTransport?.title ??
              "No transport selected yet"}
          </p>

          <p className="mt-1 text-xs leading-5 text-secondary-foreground">
            {selectedPanel.suggestedTransport?.description ??
              "No transport selected yet."}
          </p>

          <p className="mt-2 text-xs font-black text-primary">
            {selectedPanel.suggestedTransport?.costLabel ?? "Cost not set"}
          </p>
        </Surface>

        <Surface className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Utensils className="h-4 w-4 text-primary" />

            <h2 className="text-sm font-black text-foreground">Food plan</h2>
          </div>

          <div className="space-y-2">
            {selectedPanel.meals.length > 0 ? (
              selectedPanel.meals.map((meal) => (
                <div
                  key={meal.id}
                  className="rounded-2xl bg-card-secondary/60 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black text-secondary-foreground">
                      {meal.mealTypeLabel}
                    </p>

                    <p className="text-[11px] font-black text-primary">
                      {meal.costLabel}
                    </p>
                  </div>

                  <p className="mt-1 wrap-break-word text-xs font-bold text-foreground">
                    {meal.title}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs leading-5 text-secondary-foreground">
                Add meals from the editor to show your food plan here.
              </p>
            )}
          </div>
        </Surface>
      </aside>
    </main>
  );
}
