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

import ReadMoreText from "@/components/shared/ReadMoreText";
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

const GENERIC_TIMELINE_LOCATIONS = new Set([
  "",
  "activity location",
  "food stop",
  "location not set",
  "no location",
]);

function isUsefulTimelineLocation(location: string) {
  return !GENERIC_TIMELINE_LOCATIONS.has(location.trim().toLowerCase());
}

function shouldShowTimelineTag(tag: string, type: string) {
  const normalizedTag = tag.trim().toLowerCase();

  if (!normalizedTag || normalizedTag === "activity") return false;

  return normalizedTag !== type.trim().toLowerCase();
}

function getTimelineCostClass(cost: string) {
  return cost === "Cost not set"
    ? "bg-card-secondary text-secondary-foreground"
    : "bg-selected text-selected-foreground";
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

            <div className="mt-5 relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-secondary-foreground">
                  <Route className="h-3.5 w-3.5 text-primary" />
                  Day route
                </p>

                <h2 className="mt-1 text-xl font-black text-foreground">
                  {selectedPanel.displayTitle}
                </h2>

                <ReadMoreText
                  text={
                    selectedPanel.description ??
                    "Transport first, then breakfast/lunch, then activities, then dinner/snacks."
                  }
                  lines={2}
                  className="mt-1 text-xs font-semibold leading-5 text-secondary-foreground"
                />
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
                          <div className="pointer-events-none absolute left-full top-1/2 ml-0.5 hidden h-px w-2.5 border-t-2 border-dashed border-primary/40 sm:block" />
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
                      const showLocation = isUsefulTimelineLocation(
                        item.location
                      );
                      const showTag = shouldShowTimelineTag(
                        item.tag,
                        item.type
                      );

                      return (
                        <div
                          key={item.id}
                          className="grid min-w-0 md:grid-cols-[112px_minmax(0,1fr)]"
                        >
                          <div className="relative hidden justify-center sm:flex">
                            <div className="relative z-10 mt-2 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-[10px] font-black text-primary shadow-sm">
                              {index + 1}
                            </div>

                            {!isLast ? (
                              <div className="absolute left-1/2 top-8 h-[calc(100%+12px)] w-px -translate-x-1/2 bg-border/70" />
                            ) : null}
                          </div>

                          <article className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md">
                            <div className="grid min-w-0 md:grid-cols-[92px_minmax(0,1fr)]">
                              <div className="flex min-w-0 items-center justify-between gap-3 border-b border-border/70 bg-card-secondary/35 px-4 py-3 md:block md:border-b-0 md:border-r md:px-2">
                                <div className="flex items-center gap-3 md:block">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-[11px] font-black text-primary shadow-sm sm:hidden">
                                    {index + 1}
                                  </div>

                                  <div>
                                    <p className="text-lg font-black leading-none text-primary md:text-xl">
                                      {item.time}
                                    </p>

                                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-secondary-foreground">
                                      {item.period}
                                    </p>
                                  </div>
                                </div>

                                <div
                                  className=" inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/70 bg-background/90 px-2.5 py-1 text-[9px] font-semibold uppercase
                                  leading-tight tracking-[0.02em] text-secondary-foreground shadow-sm
                                  md:mt-3 md:flex md:w-full md:flex-col md:justify-center md:gap-1 md:rounded-xl md:px-1.5 md:py-2 md:text-cente "
                                >
                                  <ActivityIcon className="h-3 w-3 shrink-0 text-primary" />

                                  <span className="min-w-0 max-w-full wrap-break-word text-center leading-[1.15]">
                                    {item.type}
                                  </span>
                                </div>
                              </div>

                              <div className="min-w-0 px-4 py-3.5">
                                <div className="flex min-w-0 items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <h3 className="wrap-break-word text-[15px] font-black leading-6 text-foreground">
                                      {item.title}
                                    </h3>

                                    <ReadMoreText
                                      text={item.description}
                                      lines={2}
                                      buttonPlacement="block"
                                      className="mt-1 wrap-break-word text-[13px] leading-5 text-secondary-foreground"
                                      buttonClassName="text-[11px]"
                                    />
                                  </div>

                                  <span
                                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black shadow-sm ${getTimelineCostClass(
                                      item.cost
                                    )}`}
                                  >
                                    {item.cost}
                                  </span>
                                </div>

                                {(showLocation || showTag) ? (
                                  <div className="mt-3 flex flex-wrap gap-1.5">
                                    {showLocation ? (
                                      <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-dashboard px-2.5 py-1 text-[11px] font-bold text-secondary-foreground">
                                        <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                                        <span className="truncate">
                                          {item.location}
                                        </span>
                                      </span>
                                    ) : null}

                                    {showTag ? (
                                      <span className="rounded-full bg-card-secondary px-2.5 py-1 text-[11px] font-black text-primary">
                                        {item.tag}
                                      </span>
                                    ) : null}
                                  </div>
                                ) : null}

                                <Link
                                  href={`/dashboard/trips/${tripId}/edit`}
                                  className="mt-3 inline-flex h-fit w-fit cursor-pointer items-center rounded-full bg-dashboard px-3 py-1.5 text-[11px] font-black text-secondary-foreground transition hover:bg-card-secondary hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                                >
                                  Edit
                                </Link>
                              </div>
                            </div>
                          </article>
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

          <ReadMoreText
            text={selectedPanel.suggestedStay?.description ?? "No stay selected yet."}
            lines={2}
            className="mt-1 text-xs leading-5 text-secondary-foreground"
          />

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

          <ReadMoreText
            text={
              selectedPanel.suggestedTransport?.description ??
              "No transport selected yet."
            }
            lines={2}
            className="mt-1 text-xs leading-5 text-secondary-foreground"
          />

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
