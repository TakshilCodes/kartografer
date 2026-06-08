import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  ArrowLeft,
  BedDouble,
  Car,
  Compass,
  Edit3,
  IndianRupee,
  Map,
  MapPin,
  Navigation,
  Plus,
  Route,
  Sparkles,
  Utensils,
} from "lucide-react";

import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

type TripPreviewPageProps = {
  params: Promise<{
    tripId: string;
  }>;
};

const demoDayPlan = [
  {
    period: "Morning",
    time: "09:00",
    title: "Start from your stay",
    description: "Freshen up, have breakfast, and begin the day comfortably.",
    location: "Hotel / stay area",
    type: "Start",
    tag: "Easy start",
  },
  {
    period: "Late Morning",
    time: "11:00",
    title: "Explore the main local attraction",
    description: "Visit the key sightseeing place planned for this day.",
    location: "Primary attraction",
    type: "Explore",
    tag: "Main visit",
  },
  {
    period: "Afternoon",
    time: "14:00",
    title: "Lunch around the local market",
    description: "Try a vegetarian-friendly local meal near the main area.",
    location: "Market / restaurant area",
    type: "Meal",
    tag: "Food break",
  },
  {
    period: "Evening",
    time: "17:30",
    title: "Relaxed walk or viewpoint",
    description: "End the day with a calm market walk, lake view, or viewpoint.",
    location: "City center",
    type: "Relax",
    tag: "Slow evening",
  },
];

const demoMeals = [
  {
    label: "Breakfast",
    value: "Hotel breakfast / local snacks",
    price: "₹200–₹400",
  },
  {
    label: "Lunch",
    value: "Veg thali / North Indian meal",
    price: "₹300–₹600",
  },
  {
    label: "Dinner",
    value: "Casual dinner near stay",
    price: "₹400–₹800",
  },
];

function formatCurrency(amount: unknown) {
  if (!amount) return "Not set";

  const value = Number(amount);

  if (Number.isNaN(value)) return "Not set";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function Surface({
  children,
  className = "",
}: {
  children: ReactNode;
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

function TravelBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-card-secondary px-3 py-1.5 text-xs font-black text-secondary-foreground">
      {children}
    </span>
  );
}

function CostRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm font-semibold text-secondary-foreground">{label}</p>
      <p className="shrink-0 text-sm font-black text-foreground">{value}</p>
    </div>
  );
}

export default async function TripPreviewPage({ params }: TripPreviewPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const { tripId } = await params;

  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      userId: session.user.id,
    },
    include: {
      fromPlace: true,
      toPlace: true,
      days: {
        orderBy: {
          dayNumber: "asc",
        },
      },
      costBreakdown: true,
    },
  });

  if (!trip) {
    notFound();
  }

  const estimatedBudget = Number(trip.budgetAmount ?? 0);
  const stayEstimate = estimatedBudget ? Math.round(estimatedBudget * 0.35) : 0;
  const transportEstimate = estimatedBudget
    ? Math.round(estimatedBudget * 0.3)
    : 0;
  const foodEstimate = estimatedBudget ? Math.round(estimatedBudget * 0.2) : 0;
  const activityEstimate = estimatedBudget
    ? Math.round(estimatedBudget * 0.15)
    : 0;

  const selectedDay = trip.days[0];

  return (
    <div className="min-h-screen overflow-x-hidden bg-dashboard px-3 py-4 sm:px-5 lg:px-6">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <header className="flex flex-col gap-3 rounded-[28px] border border-border bg-card px-4 py-4 shadow-sm sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard/new"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-dashboard text-secondary-foreground transition hover:bg-card-secondary"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-selected px-2.5 py-1 text-[11px] font-black text-selected-foreground">
                  {trip.isAiGenerated ? "AI itinerary" : "Draft itinerary"}
                </span>
                <span className="text-xs font-bold text-secondary-foreground">
                  {formatEnumLabel(trip.status)}
                </span>
              </div>

              <h1 className="truncate text-xl font-black tracking-tight text-foreground sm:text-2xl">
                {trip.title}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/dashboard/trips/${trip.id}/edit`}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-dashboard px-4 py-2 text-sm font-black text-foreground transition hover:bg-card-secondary"
            >
              <Plus className="h-4 w-4" />
              Add stop
            </Link>

            <Link
              href={`/dashboard/trips/${trip.id}/edit`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-black text-primary-foreground shadow-lg shadow-primary/15 transition hover:bg-primary-hover"
            >
              <Edit3 className="h-4 w-4" />
              Customize plan
            </Link>
          </div>
        </header>

        <Surface className="relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.45]">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(84,55,29,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(84,55,29,0.08)_1px,transparent_1px)] bg-size-[34px_34px]" />
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-selected/60 blur-3xl" />
          </div>

          <div className="relative p-5 sm:p-6 lg:p-7">
            <div className="mb-5 flex items-center gap-2 text-sm font-black text-primary">
              <Map className="h-4 w-4" />
              Journey overview
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-center">
              <div className="min-w-0">
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)] sm:items-center">
                  <div className="min-w-0 rounded-3xl border border-border bg-card/80 p-4 backdrop-blur">
                    <p className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-secondary-foreground">
                      Starting point
                    </p>
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-1 h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <p className="truncate text-2xl font-black text-foreground">
                          {trip.fromPlace?.name ?? "Not selected"}
                        </p>
                        <p className="mt-1 line-clamp-1 text-xs font-semibold text-secondary-foreground">
                          {trip.fromPlace?.formattedName ??
                            "No place details available"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="hidden items-center justify-center sm:flex">
                    <div className="relative h-px w-full border-t-2 border-dashed border-primary/50">
                      <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm">
                        <Navigation className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 rounded-3xl border border-border bg-card/80 p-4 backdrop-blur">
                    <p className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-secondary-foreground">
                      Destination
                    </p>
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-1 h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <p className="truncate text-2xl font-black text-foreground">
                          {trip.toPlace?.name ?? "Not selected"}
                        </p>
                        <p className="mt-1 line-clamp-1 text-xs font-semibold text-secondary-foreground">
                          {trip.toPlace?.formattedName ??
                            "No place details available"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="mt-5 max-w-4xl text-sm leading-6 text-secondary-foreground">
                  {trip.summary ??
                    "This is your travel plan canvas. Review your route, explore the day-by-day itinerary, estimate the trip cost, and customize the plan as you go."}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <TravelBadge>
                    {trip.daysCount} {trip.daysCount === 1 ? "day" : "days"}
                  </TravelBadge>
                  <TravelBadge>
                    {trip.peopleCount}{" "}
                    {trip.peopleCount === 1 ? "person" : "people"}
                  </TravelBadge>
                  <TravelBadge>{formatEnumLabel(trip.tripType)}</TravelBadge>
                  <TravelBadge>
                    {formatEnumLabel(trip.travelPace)} pace
                  </TravelBadge>
                  <TravelBadge>{formatCurrency(trip.budgetAmount)}</TravelBadge>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-primary p-5 text-primary-foreground shadow-lg shadow-primary/15">
                <div className="mb-4 flex items-center gap-2">
                  <Compass className="h-4 w-4" />
                  <p className="text-sm font-black">Travel style</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold opacity-80">
                      Transport
                    </span>
                    <span className="text-sm font-black">
                      {formatEnumLabel(trip.transportPreference)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold opacity-80">
                      Food
                    </span>
                    <span className="text-sm font-black">
                      {formatEnumLabel(trip.foodPreference)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold opacity-80">
                      Visibility
                    </span>
                    <span className="text-sm font-black">
                      {formatEnumLabel(trip.visibility)}
                    </span>
                  </div>
                </div>

                {trip.specialNotes ? (
                  <div className="mt-4 rounded-2xl bg-primary-foreground/10 p-3">
                    <p className="text-xs font-bold opacity-80">Notes</p>
                    <p className="mt-1 line-clamp-3 text-sm leading-6">
                      {trip.specialNotes}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </Surface>

        <main className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-5">
            <Surface className="p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black text-foreground">
                    Travel days
                  </h2>
                  <p className="text-xs font-semibold text-secondary-foreground">
                    Day 1 is selected for preview
                  </p>
                </div>

                <Route className="h-4 w-4 text-primary" />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {trip.days.length > 0 ? (
                  trip.days.map((day, index) => {
                    const isActive = index === 0;

                    return (
                      <div
                        key={day.id}
                        className={`min-w-43.75 rounded-2xl border px-4 py-3 transition ${isActive
                            ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/15"
                            : "border-border bg-dashboard text-foreground hover:bg-card-secondary"
                          }`}
                      >
                        <p className="text-sm font-black">
                          Day {day.dayNumber}
                        </p>
                        <p
                          className={`mt-0.5 text-xs font-semibold ${isActive
                              ? "text-primary-foreground/80"
                              : "text-secondary-foreground"
                            }`}
                        >
                          {index === 0
                            ? "Arrival & explore"
                            : index === trip.days.length - 1
                              ? "Return / checkout"
                              : "Sightseeing day"}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-border bg-dashboard px-4 py-3 text-sm font-bold text-secondary-foreground">
                    No days created yet.
                  </div>
                )}
              </div>
            </Surface>

            <Surface className="overflow-hidden">
              <div className="relative border-b border-border bg-card-secondary/50 px-4 py-4 sm:px-5">
                <div className="absolute inset-0 opacity-40">
                  <div className="h-full w-full bg-[linear-gradient(to_right,rgba(84,55,29,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(84,55,29,0.08)_1px,transparent_1px)] bg-size-[28px_28px]" />
                </div>

                <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-secondary-foreground">
                      <Route className="h-3.5 w-3.5 text-primary" />
                      Day route
                    </p>

                    <h2 className="mt-1 text-xl font-black text-foreground">
                      {selectedDay
                        ? `Day ${selectedDay.dayNumber} — Arrival & Local Exploration`
                        : "Day plan"}
                    </h2>

                    <p className="mt-1 text-xs font-semibold text-secondary-foreground">
                      A simple travel flow from stay to sightseeing to food to
                      evening stop
                    </p>
                  </div>

                  <Link
                    href={`/dashboard/trips/${trip.id}/edit`}
                    className="inline-flex w-fit items-center gap-2 rounded-full bg-card px-4 py-2 text-xs font-black text-primary shadow-sm transition hover:bg-secondary"
                  >
                    <Plus className="h-4 w-4" />
                    Add activity
                  </Link>
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <div className="mb-5 rounded-3xl border border-border bg-dashboard p-4">
                  <div className="grid gap-3 sm:grid-cols-4">
                    {demoDayPlan.map((item, index) => {
                      const isLast = index === demoDayPlan.length - 1;

                      return (
                        <div
                          key={`mini-${item.time}-${item.title}`}
                          className="relative min-w-0"
                        >
                          {!isLast ? (
                            <div className="absolute left-[calc(100%-2px)] top-1/2 z-0 hidden h-px w-4 border-t-2 border-dashed border-primary/35 sm:block" />
                          ) : null}

                          <div className="relative z-10 rounded-2xl border border-border bg-card px-3 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                            <div className="mb-3 flex items-start justify-between gap-2">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground">
                                {index + 1}
                              </span>

                              <span className="pt-1 text-[11px] font-black text-primary">
                                {item.time}
                              </span>
                            </div>

                            <p className="line-clamp-1 text-xs font-black text-foreground">
                              {item.period}
                            </p>

                            <p className="mt-1 line-clamp-1 text-[11px] font-semibold text-secondary-foreground">
                              {item.location}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  {demoDayPlan.map((item, index) => {
                    const isLast = index === demoDayPlan.length - 1;

                    return (
                      <div
                        key={`${item.time}-${item.title}`}
                        className="grid gap-3 sm:grid-cols-[56px_minmax(0,1fr)]"
                      >
                        <div className="relative hidden justify-center sm:flex">
                          <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-sm font-black text-primary shadow-sm">
                            {index + 1}
                          </div>

                          {!isLast ? (
                            <div className="absolute left-1/2 top-11 h-[calc(100%+16px)] w-px -translate-x-1/2 bg-border" />
                          ) : null}
                        </div>

                        <div className="overflow-hidden rounded-3xl border border-border bg-dashboard shadow-sm transition hover:bg-card hover:shadow-md">
                          <div className="grid sm:grid-cols-[128px_minmax(0,1fr)]">
                            <div className="border-b border-border bg-card-secondary/65 px-4 py-3 sm:border-b-0 sm:border-r">
                              <div className="flex items-start justify-between gap-3 sm:block">
                                <div className="flex items-center gap-3 sm:block">
                                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-xs font-black text-primary shadow-sm sm:hidden">
                                    {index + 1}
                                  </div>

                                  <div>
                                    <p className="text-xl font-black leading-none text-primary">
                                      {item.time}
                                    </p>
                                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-secondary-foreground">
                                      {item.period}
                                    </p>
                                  </div>
                                </div>

                                <div className="rounded-full bg-card px-2.5 py-1 text-[10px] font-black text-secondary-foreground sm:mt-4 sm:w-fit">
                                  {item.type}
                                </div>
                              </div>
                            </div>

                            <div className="min-w-0 px-4 py-3.5">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <h3 className="text-[15px] font-black leading-6 text-foreground">
                                    {item.title}
                                  </h3>

                                  <p className="mt-1 text-[13px] leading-5 text-secondary-foreground">
                                    {item.description}
                                  </p>

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-bold text-secondary-foreground">
                                      <MapPin className="h-3.5 w-3.5 text-primary" />
                                      {item.location}
                                    </span>

                                    <span className="rounded-full bg-selected/60 px-2.5 py-1 text-[11px] font-black text-selected-foreground">
                                      {item.tag}
                                    </span>
                                  </div>
                                </div>

                                <Link
                                  href={`/dashboard/trips/${trip.id}/edit`}
                                  className="inline-flex h-fit w-fit shrink-0 items-center rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-black text-foreground transition hover:bg-card-secondary"
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
            </Surface>
          </div>

          <aside className="min-w-0 space-y-5 xl:sticky xl:top-4 xl:h-fit">
            <Surface className="overflow-hidden">
              <div className="border-b border-border bg-card-secondary/50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-primary" />
                  <div>
                    <h2 className="text-sm font-black text-foreground">
                      Trip basket
                    </h2>
                    <p className="text-xs font-semibold text-secondary-foreground">
                      Checkout-style estimate
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-3">
                  <CostRow
                    label="Stay"
                    value={
                      stayEstimate ? formatCurrency(stayEstimate) : "Not set"
                    }
                  />
                  <CostRow
                    label="Transport"
                    value={
                      transportEstimate
                        ? formatCurrency(transportEstimate)
                        : "Not set"
                    }
                  />
                  <CostRow
                    label="Food"
                    value={
                      foodEstimate ? formatCurrency(foodEstimate) : "Not set"
                    }
                  />
                  <CostRow
                    label="Activities"
                    value={
                      activityEstimate
                        ? formatCurrency(activityEstimate)
                        : "Not set"
                    }
                  />
                </div>

                <div className="my-4 border-t border-dashed border-border" />

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-foreground">
                      Estimated total
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-secondary-foreground">
                      For {trip.peopleCount}{" "}
                      {trip.peopleCount === 1 ? "person" : "people"} ·{" "}
                      {trip.daysCount} {trip.daysCount === 1 ? "day" : "days"}
                    </p>
                  </div>

                  <p className="text-lg font-black text-primary">
                    {formatCurrency(trip.budgetAmount)}
                  </p>
                </div>

                <Link
                  href={`/dashboard/trips/${trip.id}/edit`}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground transition hover:bg-primary-hover"
                >
                  Edit trip cost
                </Link>
              </div>
            </Surface>

            <Surface className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <BedDouble className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-black text-foreground">
                  Suggested stay
                </h2>
              </div>

              <p className="text-sm font-black text-foreground">
                Comfort family stay
              </p>
              <p className="mt-1 text-xs leading-5 text-secondary-foreground">
                Clean hotel near the main area with parking and family-friendly
                rooms.
              </p>
              <p className="mt-2 text-xs font-black text-primary">
                ₹2,500–₹4,500/night
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
                Private cab / local taxi
              </p>
              <p className="mt-1 text-xs leading-5 text-secondary-foreground">
                Best for flexible family travel and nearby sightseeing.
              </p>
              <p className="mt-2 text-xs font-black text-primary">
                ₹3,000–₹5,500/day
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
                {demoMeals.map((meal) => (
                  <div
                    key={meal.label}
                    className="rounded-2xl bg-card-secondary/60 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-black text-secondary-foreground">
                        {meal.label}
                      </p>
                      <p className="text-[11px] font-black text-primary">
                        {meal.price}
                      </p>
                    </div>
                    <p className="mt-1 text-xs font-bold text-foreground">
                      {meal.value}
                    </p>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-black text-foreground">
                  Next planning step
                </h2>
              </div>

              <p className="text-xs leading-5 text-secondary-foreground">
                Start by adding real places to Day 1, then connect stay,
                transport, meals, and budget to your database.
              </p>
            </Surface>
          </aside>
        </main>
      </div>
    </div>
  );
}