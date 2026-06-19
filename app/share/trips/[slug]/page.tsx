import { notFound } from "next/navigation";

import PublicTripPreview from "@/components/trips/share/PublicTripPreview";
import { buildPreviewDayPanels } from "@/lib/trips/build-preview-day-panels";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PublicSharedTripPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatCurrency(amount: unknown, currency: string) {
  if (amount === null || amount === undefined || amount === "") {
    return "Not set";
  }

  const value = Number(amount);

  if (!Number.isFinite(value)) return "Not set";

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${Math.round(value).toLocaleString("en-IN")}`;
  }
}

function getDisplayDayTitle(day?: { dayNumber: number; title: string }) {
  if (!day) return "Day 1";

  const defaultTitle = `Day ${day.dayNumber}`;

  if (!day.title || day.title.trim() === defaultTitle) {
    return defaultTitle;
  }

  return `${defaultTitle} - ${day.title}`;
}

export default async function PublicSharedTripPage({
  params,
}: PublicSharedTripPageProps) {
  const { slug } = await params;

  if (!slug.trim()) {
    notFound();
  }

  const trip = await prisma.trip.findFirst({
    where: {
      publicShareSlug: slug,
      isPublicShareEnabled: true,
    },
    select: {
      title: true,
      summary: true,
      daysCount: true,
      peopleCount: true,
      budgetAmount: true,
      currency: true,
      tripType: true,
      travelPace: true,
      foodPreference: true,
      transportPreference: true,
      fromPlace: {
        select: {
          name: true,
          formattedName: true,
        },
      },
      toPlace: {
        select: {
          name: true,
          formattedName: true,
        },
      },
      days: {
        orderBy: {
          dayNumber: "asc",
        },
        select: {
          id: true,
          dayNumber: true,
          title: true,
          description: true,
        },
      },
      transportOptions: {
        where: {
          isSelected: true,
        },
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
        },
      },
      stayOptions: {
        where: {
          isSelected: true,
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          tripDayId: true,
          name: true,
          city: true,
          area: true,
          bestFor: true,
          pricePerNight: true,
          totalCost: true,
          isSelected: true,
        },
      },
      mealSuggestions: {
        where: {
          isSelected: true,
        },
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
        where: {
          isSelected: true,
        },
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
          category: true,
          estimatedCost: true,
          isSelected: true,
          notes: true,
        },
      },
      costBreakdown: {
        select: {
          transportCost: true,
          stayCost: true,
          foodCost: true,
          activityCost: true,
          totalEstimatedCost: true,
          budgetStatus: true,
        },
      },
    },
  });

  if (!trip) {
    notFound();
  }

  const formatTripCurrency = (amount: unknown) =>
    formatCurrency(amount, trip.currency);
  const dayPanels = buildPreviewDayPanels({
    days: trip.days,
    transportOptions: trip.transportOptions,
    stayOptions: trip.stayOptions,
    mealSuggestions: trip.mealSuggestions,
    activities: trip.activities,
    formatCurrency: formatTripCurrency,
    formatEnumLabel,
    getDisplayDayTitle,
  });

  return (
    <PublicTripPreview
      trip={{
        title: trip.title,
        summary: trip.summary,
        fromName: trip.fromPlace?.name ?? "Starting point not set",
        fromDetails: trip.fromPlace?.formattedName ?? null,
        toName: trip.toPlace?.name ?? "Destination not set",
        toDetails: trip.toPlace?.formattedName ?? null,
        daysCount: trip.daysCount,
        peopleCount: trip.peopleCount,
        tripType: formatEnumLabel(trip.tripType),
        travelPace: formatEnumLabel(trip.travelPace),
        transportPreference: formatEnumLabel(trip.transportPreference),
        foodPreference: formatEnumLabel(trip.foodPreference),
      }}
      dayPanels={dayPanels}
      costSummary={
        trip.costBreakdown || trip.budgetAmount
          ? {
              transport: formatTripCurrency(
                trip.costBreakdown?.transportCost
              ),
              stay: formatTripCurrency(trip.costBreakdown?.stayCost),
              food: formatTripCurrency(trip.costBreakdown?.foodCost),
              activities: formatTripCurrency(
                trip.costBreakdown?.activityCost
              ),
              total: formatTripCurrency(
                trip.costBreakdown?.totalEstimatedCost
              ),
              budget: trip.budgetAmount
                ? formatTripCurrency(trip.budgetAmount)
                : null,
              status: trip.costBreakdown
                ? formatEnumLabel(trip.costBreakdown.budgetStatus)
                : null,
            }
          : null
      }
    />
  );
}
