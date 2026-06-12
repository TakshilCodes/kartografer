import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  ArrowLeft,
  Compass,
  Edit3,
  IndianRupee,
  Map,
  MapPin,
  Navigation,
  Plus,
} from "lucide-react";

import TripPreviewDayPanel from "@/components/trips/preview/TripPreviewDayPanel";
import { buildPreviewDayPanels } from "@/lib/trips/build-preview-day-panels";
import { ensureTripCostBreakdown } from "@/lib/trips/recalculate-trip-cost";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

type TripPreviewPageProps = {
  params: Promise<{
    tripId: string;
  }>;
  searchParams?: Promise<{
    day?: string;
  }>;
};

function formatCurrency(amount: unknown) {
  if (amount === null || amount === undefined || amount === "") return "Not set";

  const value = Number(amount);

  if (Number.isNaN(value)) return "Not set";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatEnumLabel(value: string) {
  return String(value)
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getNumberValue(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;

  const numberValue = Number(value);

  return Number.isNaN(numberValue) ? 0 : numberValue;
}

function getDisplayDayTitle(day?: { dayNumber: number; title: string }) {
  if (!day) return "Day 1";

  const defaultTitle = `Day ${day.dayNumber}`;

  if (!day.title || day.title.trim() === defaultTitle) {
    return `Day ${day.dayNumber}`;
  }

  return `Day ${day.dayNumber} — ${day.title}`;
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

function getBudgetStatusLabel(status?: string) {
  switch (status) {
    case "BUDGET_FRIENDLY":
      return "Budget friendly";
    case "UNDER_BUDGET":
      return "Under budget";
    case "SLIGHTLY_OVER":
      return "Slightly over";
    case "OVER_BUDGET":
      return "Over budget";
    default:
      return "Budget unknown";
  }
}

function getBudgetStatusClass(status?: string) {
  switch (status) {
    case "BUDGET_FRIENDLY":
    case "UNDER_BUDGET":
      return "bg-success text-success-foreground";
    case "SLIGHTLY_OVER":
      return "bg-warning text-warning-foreground";
    case "OVER_BUDGET":
      return "bg-danger text-danger-foreground";
    default:
      return "border border-border bg-card text-secondary-foreground";
  }
}

export default async function TripPreviewPage({
  params,
  searchParams,
}: TripPreviewPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const { tripId } = await params;
  const resolvedSearchParams = await searchParams;
  const selectedDayFromUrl = Number(resolvedSearchParams?.day ?? "1");

  const accessibleTrip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  });

  if (!accessibleTrip) {
    notFound();
  }

  await ensureTripCostBreakdown(tripId);

  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      userId: session.user.id,
    },
    include: {
      fromPlace: true,
      toPlace: true,
      costBreakdown: true,
      days: {
        orderBy: {
          dayNumber: "asc",
        },
        select: {
          id: true,
          dayNumber: true,
          title: true,
          description: true,
          notes: true,
          estimatedCost: true,
        },
      },
      transportOptions: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          tripDayId: true,
          title: true,
          mode: true,
          fromText: true,
          toText: true,
          description: true,
          costType: true,
          pricePerPerson: true,
          totalCost: true,
          isSelected: true,
          notes: true,
        },
      },
      stayOptions: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          tripDayId: true,
          name: true,
          city: true,
          area: true,
          stayType: true,
          budgetLevel: true,
          pricePerNight: true,
          nights: true,
          totalCost: true,
          isSelected: true,
          bestFor: true,
          notes: true,
        },
      },
      mealSuggestions: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          tripDayId: true,
          mealType: true,
          title: true,
          locationName: true,
          estimatedCost: true,
          isSelected: true,
          notes: true,
        },
      },
      activities: {
        orderBy: {
          position: "asc",
        },
        select: {
          id: true,
          tripDayId: true,
          title: true,
          description: true,
          locationName: true,
          address: true,
          startTime: true,
          endTime: true,
          durationMinutes: true,
          category: true,
          estimatedCost: true,
          isSelected: true,
          notes: true,
          position: true,
        },
      },
    },
  });

  if (!trip) {
    notFound();
  }

  const dayPanels = buildPreviewDayPanels({
    days: trip.days,
    transportOptions: trip.transportOptions,
    stayOptions: trip.stayOptions,
    mealSuggestions: trip.mealSuggestions,
    activities: trip.activities,
    formatCurrency,
    formatEnumLabel,
    getDisplayDayTitle,
  });

  const transportEstimate = getNumberValue(trip.costBreakdown?.transportCost);
  const stayEstimate = getNumberValue(trip.costBreakdown?.stayCost);
  const foodEstimate = getNumberValue(trip.costBreakdown?.foodCost);
  const activityEstimate = getNumberValue(trip.costBreakdown?.activityCost);
  const miscEstimate = getNumberValue(trip.costBreakdown?.miscCost);
  const estimatedTotal = getNumberValue(
    trip.costBreakdown?.totalEstimatedCost
  );
  const budgetAmount = getNumberValue(
    trip.costBreakdown?.userBudget ?? trip.budgetAmount
  );
  const budgetStatus = trip.costBreakdown?.budgetStatus ?? "UNKNOWN";
  const remainingAmount = budgetAmount - estimatedTotal;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background px-3 py-4 sm:px-5 lg:px-6">
      <div className="mx-auto w-full max-w-330 space-y-5">
        <header className="flex flex-col gap-3 rounded-[28px] border border-border bg-card px-4 py-4 shadow-sm sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard/new"
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-dashboard text-secondary-foreground transition hover:bg-card-secondary"
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
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-black text-primary-foreground shadow-lg shadow-primary/15 transition hover:bg-primary-hover"
            >
              <Edit3 className="h-4 w-4" />
              Customize plan
            </Link>
          </div>
        </header>

        <Surface className="relative overflow-hidden bg-card">
          <div className="absolute inset-0 opacity-[0.5]">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(84,55,29,0.075)_1px,transparent_1px),linear-gradient(to_bottom,rgba(84,55,29,0.075)_1px,transparent_1px)] bg-size-[34px_34px]" />
            <div className="absolute -right-20 -top-22.5 h-72 w-72 rounded-full bg-card-secondary/80 blur-3xl" />
          </div>

          <div className="relative p-5 sm:p-6 lg:p-7">
            <div className="mb-5 flex items-center gap-2 text-sm font-black text-primary">
              <Map className="h-4 w-4" />
              Journey overview
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-center">
              <div className="min-w-0">
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)] sm:items-center">
                  <div className="min-w-0 rounded-3xl border border-border bg-dashboard p-4 shadow-sm">
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
                    <div className="relative h-px w-full border-t-2 border-dashed border-primary/45">
                      <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm">
                        <Navigation className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 rounded-3xl border border-border bg-dashboard p-4 shadow-sm">
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
              </div>
            </div>
          </div>
        </Surface>

        <TripPreviewDayPanel
          tripId={trip.id}
          dayPanels={dayPanels}
          initialDayNumber={selectedDayFromUrl}
          costSidebar={
            <Surface className="overflow-hidden">
              <div className="border-b border-border bg-card-secondary/50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-primary" />

                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-black text-foreground">
                      Trip basket
                    </h2>

                    <p className="text-xs font-semibold text-secondary-foreground">
                      Checkout-style estimate
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-black ${getBudgetStatusClass(
                      budgetStatus
                    )}`}
                  >
                    {getBudgetStatusLabel(budgetStatus)}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-3">
                  <CostRow label="Stay" value={formatCurrency(stayEstimate)} />

                  <CostRow
                    label="Transport"
                    value={formatCurrency(transportEstimate)}
                  />

                  <CostRow
                    label="Food"
                    value={formatCurrency(foodEstimate)}
                  />

                  <CostRow
                    label="Activities"
                    value={formatCurrency(activityEstimate)}
                  />

                  {miscEstimate > 0 ? (
                    <CostRow label="Misc" value={formatCurrency(miscEstimate)} />
                  ) : null}
                </div>

                <div className="my-4 border-t border-dashed border-border" />

                <CostRow
                  label="Budget"
                  value={
                    budgetAmount > 0 ? formatCurrency(budgetAmount) : "Not set"
                  }
                />

                <div className="mt-4 flex items-start justify-between gap-4">
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
                    {formatCurrency(estimatedTotal)}
                  </p>
                </div>

                {budgetAmount > 0 ? (
                  <p className="mt-2 text-right text-xs font-bold text-secondary-foreground">
                    {remainingAmount >= 0
                      ? `${formatCurrency(remainingAmount)} remaining`
                      : `${formatCurrency(Math.abs(remainingAmount))} over budget`}
                  </p>
                ) : null}

                <Link
                  href={`/dashboard/trips/${trip.id}/edit`}
                  className="mt-4 inline-flex w-full cursor-pointer items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground transition hover:bg-primary-hover"
                >
                  Edit trip cost
                </Link>
              </div>
            </Surface>
          }
        />
      </div>
    </div>
  );
}
