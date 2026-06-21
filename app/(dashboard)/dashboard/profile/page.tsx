import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import EditProfileForm from "@/components/user/profile/EditProfileForm";
import LatestTripsPanel, {
  type ProfileLatestTrip,
} from "@/components/user/profile/LatestTripsPanel";
import ProfileOverviewCard from "@/components/user/profile/ProfileOverviewCard";
import ProfileStatsGrid from "@/components/user/profile/ProfileStatsGrid";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function getPlaceLabel(place: { name: string; formattedName: string } | null) {
  if (!place) return null;
  return place.formattedName || place.name;
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const userId = session.user.id;
  const [
    user,
    tripTotals,
    aiGeneratedTrips,
    publicSharedTrips,
    draftTrips,
    latestTrips,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.trip.aggregate({
      where: { userId },
      _count: { _all: true },
      _sum: { daysCount: true },
    }),
    prisma.trip.count({ where: { userId, isAiGenerated: true } }),
    prisma.trip.count({ where: { userId, isPublicShareEnabled: true } }),
    prisma.trip.count({ where: { userId, status: "DRAFT" } }),
    prisma.trip.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        daysCount: true,
        updatedAt: true,
        fromPlace: {
          select: { name: true, formattedName: true },
        },
        toPlace: {
          select: { name: true, formattedName: true },
        },
      },
    }),
  ]);

  if (!user) {
    notFound();
  }

  const displayName = user.name?.trim() || "Kartografer Explorer";
  const latestTripCards: ProfileLatestTrip[] = latestTrips.map((trip) => ({
    id: trip.id,
    title: trip.title,
    fromPlace: getPlaceLabel(trip.fromPlace),
    toPlace: getPlaceLabel(trip.toPlace),
    daysCount: trip.daysCount,
    updatedAt: trip.updatedAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-dashboard px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="border-b border-border pb-5">
          <p className="text-xs font-black uppercase text-muted-foreground">
            Your account
          </p>
          <h1 className="mt-1 text-3xl font-black text-foreground">Profile</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary-foreground">
            Manage your display name and review the journeys you have planned with Kartografer.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)] lg:items-start">
          <ProfileOverviewCard
            name={displayName}
            email={user.email ?? "Email unavailable"}
            image={user.image}
            joinedAt={user.createdAt.toISOString()}
          />
          <EditProfileForm initialName={displayName} />
        </div>

        <ProfileStatsGrid
          totalTrips={tripTotals._count._all}
          aiGeneratedTrips={aiGeneratedTrips}
          publicSharedTrips={publicSharedTrips}
          draftTrips={draftTrips}
          totalDaysPlanned={tripTotals._sum.daysCount ?? 0}
          lastTripUpdatedAt={latestTrips[0]?.updatedAt.toISOString() ?? null}
        />

        <LatestTripsPanel trips={latestTripCards} />
      </div>
    </div>
  );
}