import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Plus } from "lucide-react";

import EmptyTripsState from "@/components/trips/my-trips/EmptyTripsState";
import MyTripsGrid from "@/components/trips/my-trips/MyTripsGrid";
import type { MyTripCardData } from "@/components/trips/my-trips/TripCard";
import { authOptions } from "@/lib/auth";
import { getPublicTripShareUrl } from "@/lib/app-url";
import prisma from "@/lib/prisma";

function getPlaceLabel(place: { name: string; formattedName: string } | null) {
  if (!place) return null;

  return place.formattedName || place.name;
}

function serializeNullableDate(value: Date | null) {
  return value ? value.toISOString() : null;
}

export default async function MyTripsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const trips = await prisma.trip.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: [
      {
        updatedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    select: {
      id: true,
      title: true,
      summary: true,
      daysCount: true,
      peopleCount: true,
      budgetAmount: true,
      currency: true,
      status: true,
      isAiGenerated: true,
      createdAt: true,
      updatedAt: true,
      isPublicShareEnabled: true,
      publicShareSlug: true,
      publicSharedAt: true,
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
      costBreakdown: {
        select: {
          totalEstimatedCost: true,
          budgetStatus: true,
        },
      },
      _count: {
        select: {
          days: true,
          activities: true,
        },
      },
    },
  });

  const tripCards: MyTripCardData[] = trips.map((trip) => ({
    id: trip.id,
    title: trip.title,
    summary: trip.summary,
    daysCount: trip.daysCount,
    peopleCount: trip.peopleCount,
    budgetAmount: trip.budgetAmount?.toString() ?? null,
    currency: trip.currency,
    status: trip.status,
    isAiGenerated: trip.isAiGenerated,
    createdAt: trip.createdAt.toISOString(),
    updatedAt: trip.updatedAt.toISOString(),
    fromPlace: getPlaceLabel(trip.fromPlace),
    toPlace: getPlaceLabel(trip.toPlace),
    totalEstimatedCost:
      trip.costBreakdown?.totalEstimatedCost.toString() ?? null,
    budgetStatus: trip.costBreakdown?.budgetStatus ?? null,
    dayCount: trip._count.days,
    activityCount: trip._count.activities,
    isPublicShareEnabled: trip.isPublicShareEnabled,
    publicShareUrl: trip.publicShareSlug
      ? getPublicTripShareUrl(trip.publicShareSlug)
      : null,
    publicSharedAt: serializeNullableDate(trip.publicSharedAt),
  }));

  return (
    <div className="min-h-screen bg-dashboard px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-muted-foreground">
              Travel library
            </p>
            <h1 className="mt-1 text-3xl font-black text-foreground">My Trips</h1>
            <p className="mt-2 text-sm text-secondary-foreground">
              Revisit your plans, continue editing, or start somewhere new.
            </p>
          </div>

          {tripCards.length > 0 ? (
            <Link
              href="/dashboard/new"
              className="inline-flex h-11 w-fit items-center gap-2 rounded-full bg-primary px-4 text-sm font-black text-primary-foreground transition hover:bg-primary-hover"
            >
              <Plus className="h-4 w-4" />
              New trip
            </Link>
          ) : null}
        </header>

        {tripCards.length > 0 ? (
          <MyTripsGrid trips={tripCards} />
        ) : (
          <EmptyTripsState />
        )}
      </div>
    </div>
  );
}
