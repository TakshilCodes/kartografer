import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  Bot,
  Globe2,
  Link2,
  Map as MapIcon,
  MessageSquareText,
  PencilLine,
  Route,
  ShieldCheck,
} from "lucide-react";

import EditProfileForm from "@/components/user/profile/EditProfileForm";
import LatestTripsPanel, {
  type ProfileLatestTrip,
} from "@/components/user/profile/LatestTripsPanel";
import ProfileOverviewCard from "@/components/user/profile/ProfileOverviewCard";
import ProfileStatsGrid from "@/components/user/profile/ProfileStatsGrid";
import {
  AI_CHAT_BURST_LIMIT,
  AI_CHAT_TRIP_DAILY_LIMIT,
  AI_CHAT_USER_DAILY_LIMIT,
  getAiChatLimitUsageSnapshot,
  AI_LONG_TRIP_GENERATION_DAILY_LIMIT,
  AI_TRIP_GENERATION_DAILY_LIMIT,
} from "@/lib/rate-limit/ai-rate-limit";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MANUAL_TRIP_CREATION_DAILY_LIMIT } from "@/lib/rate-limit/trip-creation-rate-limit";

function getPlaceLabel(place: { name: string; formattedName: string } | null) {
  if (!place) return null;
  return place.formattedName || place.name;
}

function getStartOfDay() {
  const now = new Date();

  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatUsageTime(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

type AiAssistantTripUsage = {
  tripId: string;
  title: string;
  fromPlace: string | null;
  toPlace: string | null;
  successfulMessagesToday: number;
  quotaMessagesToday: number;
  lastUsedAt: Date;
};

function UsageMetricCard({
  icon,
  label,
  value,
  description,
  tone = "default",
  current,
  max,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  description: string;
  tone?: "default" | "primary" | "success" | "warning";
  current?: number;
  max?: number;
}) {
  const toneClass =
    tone === "primary"
      ? "bg-primary text-primary-foreground"
      : tone === "success"
        ? "bg-success text-success-foreground"
        : tone === "warning"
          ? "bg-warning text-warning-foreground"
          : "bg-card-secondary text-primary";

  const progressPercent =
    typeof current === "number" && typeof max === "number" && max > 0
      ? Math.min(100, Math.round((current / max) * 100))
      : 0;

  const isExhausted =
    typeof current === "number" && typeof max === "number" && current >= max;
  const progressBarClass =
    isExhausted
      ? "bg-danger"
      : tone === "primary"
        ? "bg-primary"
        : tone === "success"
          ? "bg-success"
          : tone === "warning"
            ? "bg-warning"
            : "bg-primary";

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card-hover/35 hover:shadow-md">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-card-secondary/60 blur-2xl transition group-hover:bg-primary/10" />

      <div className="relative">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${toneClass}`}
          >
            {icon}
          </div>

          <p className="text-3xl font-black tracking-tight text-foreground">
            {value}
          </p>
        </div>

        <p className="text-sm font-black text-foreground">{label}</p>

        <p className="mt-1.5 text-xs font-semibold leading-5 text-secondary-foreground">
          {description}
        </p>

        {typeof current === "number" && typeof max === "number" ? (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-secondary-foreground">
                Usage
              </span>
              <span className="text-[11px] font-black text-foreground">
                {current}/{max}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-card-secondary">
              <div
                className={`h-full rounded-full transition-all duration-300 ${progressBarClass}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p
              className={`mt-2 text-[11px] font-black ${
                isExhausted ? "text-danger" : "text-secondary-foreground"
              }`}
            >
              {isExhausted
                ? "Limit exhausted"
                : `${Math.max(0, max - current)} remaining`}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AiAssistantTripUsageSection({
  trips,
}: {
  trips: AiAssistantTripUsage[];
}) {
  const perTripLimit = AI_CHAT_TRIP_DAILY_LIMIT;

  return (
    <section className="overflow-hidden rounded-4xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-card-secondary/45 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-primary shadow-sm">
              <MessageSquareText className="h-3.5 w-3.5" />
              AI assistant activity
            </div>

            <h2 className="text-xl font-black tracking-tight text-foreground">
              Recent trips using AI assistant
            </h2>

            <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-secondary-foreground">
              Quota usage matches the same Redis counters that protect AI chat.
            </p>
          </div>

          <span className="w-fit rounded-full border border-border bg-card px-3 py-1.5 text-xs font-black text-secondary-foreground">
            {perTripLimit} replies per trip/day
          </span>
        </div>
      </div>

      <div className="space-y-3 p-5 sm:p-6">
        {trips.length > 0 ? (
          trips.map((trip) => {
            const progressPercent = Math.min(
              100,
              Math.round((trip.quotaMessagesToday / perTripLimit) * 100)
            );
            const isExhausted = trip.quotaMessagesToday >= perTripLimit;

            return (
              <Link
                key={trip.tripId}
                href={`/dashboard/trips/${trip.tripId}/edit`}
                className="group block rounded-3xl border border-border bg-card-secondary/35 p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card-hover/45 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-card px-2.5 py-1 text-[11px] font-black text-primary">
                        {trip.successfulMessagesToday > 0
                          ? `Last reply at ${formatUsageTime(trip.lastUsedAt)}`
                          : "Quota used today"}
                      </span>

                      {isExhausted ? (
                        <span className="rounded-full bg-danger px-2.5 py-1 text-[11px] font-black text-danger-foreground">
                          Limit exhausted
                        </span>
                      ) : null}
                    </div>

                    <h3 className="line-clamp-1 text-base font-black text-foreground">
                      {trip.title}
                    </h3>

                    <p className="mt-1 line-clamp-1 text-xs font-semibold text-secondary-foreground">
                      {[trip.fromPlace, trip.toPlace].filter(Boolean).join(" -> ") ||
                        "Route details unavailable"}
                    </p>
                  </div>

                  <div className="w-full shrink-0 lg:w-72">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-xs font-black text-foreground">
                        {trip.quotaMessagesToday}/{perTripLimit} used
                      </span>
                      <span className="text-[11px] font-bold text-secondary-foreground">
                        {Math.max(0, perTripLimit - trip.quotaMessagesToday)} left
                      </span>
                    </div>

                    <div className="h-2.5 overflow-hidden rounded-full bg-card">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isExhausted ? "bg-danger" : "bg-primary"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-card-secondary/30 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-card text-primary">
                <MessageSquareText className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-black text-foreground">
                  No AI assistant usage today
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 text-secondary-foreground">
                  Once you chat with Kartografer AI inside a trip, that trip will
                  appear here with its per-trip daily usage.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function UsageOverviewSection({
  aiGeneratedTripsToday,
  longAiGeneratedTripsToday,
  manualTripsToday,
  aiAssistantMessagesToday,
  aiAssistantTripMessagesToday,
  aiAssistantMessagesLastMinute,
  publicExploreTrips,
  publicSharedTrips,
  totalTrips,
}: {
  aiGeneratedTripsToday: number;
  longAiGeneratedTripsToday: number;
  manualTripsToday: number;
  aiAssistantMessagesToday: number;
  aiAssistantTripMessagesToday: number;
  aiAssistantMessagesLastMinute: number;
  publicExploreTrips: number;
  publicSharedTrips: number;
  totalTrips: number;
}) {
  const aiAssistantUserDailyLimit = AI_CHAT_USER_DAILY_LIMIT;
  const aiAssistantTripDailyLimit = AI_CHAT_TRIP_DAILY_LIMIT;
  const aiAssistantBurstLimit = AI_CHAT_BURST_LIMIT;

  return (
    <section className="overflow-hidden rounded-4xl border border-border bg-card shadow-sm">
      <div className="relative overflow-hidden border-b border-border bg-card-secondary/50 px-5 py-5 sm:px-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-primary shadow-sm">
              <Route className="h-3.5 w-3.5" />
              Usage & limits
            </div>

            <h2 className="text-2xl font-black tracking-tight text-foreground">
              Your Kartografer usage
            </h2>

            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-secondary-foreground">
              Track your daily planning limits, AI usage, public sharing, and
              overall workspace activity.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
        <UsageMetricCard
          icon={<Bot className="h-5 w-5" />}
          label="AI trips today"
          value={`${aiGeneratedTripsToday}/${AI_TRIP_GENERATION_DAILY_LIMIT}`}
          description="AI-generated trips used from your daily limit."
          tone="primary"
          current={aiGeneratedTripsToday}
          max={AI_TRIP_GENERATION_DAILY_LIMIT}
        />

        <UsageMetricCard
          icon={<Route className="h-5 w-5" />}
          label="Long AI trips"
          value={`${longAiGeneratedTripsToday}/${AI_LONG_TRIP_GENERATION_DAILY_LIMIT}`}
          description="Long trip generations used from today's limit."
          tone="warning"
          current={longAiGeneratedTripsToday}
          max={AI_LONG_TRIP_GENERATION_DAILY_LIMIT}
        />

        <UsageMetricCard
          icon={<PencilLine className="h-5 w-5" />}
          label="Manual trips today"
          value={`${manualTripsToday}/${MANUAL_TRIP_CREATION_DAILY_LIMIT}`}
          description="Manual trips created from your daily limit."
          current={manualTripsToday}
          max={MANUAL_TRIP_CREATION_DAILY_LIMIT}
        />

        <UsageMetricCard
          icon={<MessageSquareText className="h-5 w-5" />}
          label="AI assistant replies"
          value={`${aiAssistantMessagesToday}/${aiAssistantUserDailyLimit}`}
          description="AI chat quota used from your daily assistant limit."
          tone="primary"
          current={aiAssistantMessagesToday}
          max={aiAssistantUserDailyLimit}
        />

        <UsageMetricCard
          icon={<MapIcon className="h-5 w-5" />}
          label="Busiest trip chat"
          value={`${aiAssistantTripMessagesToday}/${aiAssistantTripDailyLimit}`}
          description="Highest per-trip AI chat quota used today."
          current={aiAssistantTripMessagesToday}
          max={aiAssistantTripDailyLimit}
        />

        <UsageMetricCard
          icon={<MessageSquareText className="h-5 w-5" />}
          label="Chat burst usage"
          value={`${aiAssistantMessagesLastMinute}/${aiAssistantBurstLimit}`}
          description="AI chat quota used in the last minute."
          tone="warning"
          current={aiAssistantMessagesLastMinute}
          max={aiAssistantBurstLimit}
        />

        <UsageMetricCard
          icon={<Globe2 className="h-5 w-5" />}
          label="Explore templates"
          value={publicExploreTrips}
          description="Trips published publicly as reusable templates."
          tone="success"
        />

        <UsageMetricCard
          icon={<Link2 className="h-5 w-5" />}
          label="Share links"
          value={publicSharedTrips}
          description="Trips with read-only public sharing enabled."
        />

        <UsageMetricCard
          icon={<MapIcon className="h-5 w-5" />}
          label="Total trips"
          value={totalTrips}
          description="All trips created in your Kartografer workspace."
        />
      </div>

      <div className="border-t border-border bg-card px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-card-secondary/35 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card text-primary">
            <ShieldCheck className="h-4 w-4" />
          </div>

          <div>
            <p className="text-sm font-black text-foreground">
              Global AI safety limit
            </p>

            <p className="mt-1 text-xs font-semibold leading-5 text-secondary-foreground">
              Kartografer also has a global daily AI request limit across the
              whole app to protect the platform from sudden high usage spikes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const userId = session.user.id;
  const startOfDay = getStartOfDay();

  const [
    user,
    tripTotals,
    aiGeneratedTrips,
    aiGeneratedTripsToday,
    longAiGeneratedTripsToday,
    manualTripsToday,
    publicSharedTrips,
    publicExploreTrips,
    draftTrips,
    latestTrips,
    usageTrips,
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

    prisma.trip.count({
      where: {
        userId,
        isAiGenerated: true,
      },
    }),

    prisma.trip.count({
      where: {
        userId,
        isAiGenerated: true,
        createdAt: {
          gte: startOfDay,
        },
      },
    }),

    prisma.trip.count({
      where: {
        userId,
        isAiGenerated: true,
        daysCount: {
          gte: 8,
        },
        createdAt: {
          gte: startOfDay,
        },
      },
    }),

    prisma.trip.count({
      where: {
        userId,
        isAiGenerated: false,
        createdAt: {
          gte: startOfDay,
        },
      },
    }),

    prisma.trip.count({
      where: {
        userId,
        isPublicShareEnabled: true,
      },
    }),

    prisma.trip.count({
      where: {
        userId,
        isPublic: true,
      },
    }),

    prisma.trip.count({
      where: {
        userId,
        status: "DRAFT",
      },
    }),

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

    prisma.trip.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
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
  const totalTrips = tripTotals._count._all;

  const latestTripCards: ProfileLatestTrip[] = latestTrips.map((trip) => ({
    id: trip.id,
    title: trip.title,
    fromPlace: getPlaceLabel(trip.fromPlace),
    toPlace: getPlaceLabel(trip.toPlace),
    daysCount: trip.daysCount,
    updatedAt: trip.updatedAt.toISOString(),
  }));

  const lastMinuteStart = new Date();
  lastMinuteStart.setMinutes(lastMinuteStart.getMinutes() - 1);

  const [
    dbAiAssistantMessagesToday,
    dbAiAssistantMessagesLastMinute,
    aiAssistantRecentMessagesToday,
  ] = await Promise.all([
    prisma.tripChatMessage.count({
      where: {
        userId,
        role: "ASSISTANT",
        createdAt: {
          gte: startOfDay,
        },
      },
    }),

    prisma.tripChatMessage.count({
      where: {
        userId,
        role: "ASSISTANT",
        createdAt: {
          gte: lastMinuteStart,
        },
      },
    }),

    prisma.tripChatMessage.findMany({
      where: {
        userId,
        role: "ASSISTANT",
        createdAt: {
          gte: startOfDay,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        tripId: true,
        createdAt: true,
        trip: {
          select: {
            id: true,
            title: true,
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
          },
        },
      },
    }),
  ]);

  const aiAssistantTripUsageMap = new Map<string, AiAssistantTripUsage>();

  for (const message of aiAssistantRecentMessagesToday) {
    const existingTripUsage = aiAssistantTripUsageMap.get(message.tripId);

    if (existingTripUsage) {
      existingTripUsage.successfulMessagesToday += 1;
      existingTripUsage.quotaMessagesToday += 1;
      continue;
    }

    aiAssistantTripUsageMap.set(message.tripId, {
      tripId: message.tripId,
      title: message.trip.title,
      fromPlace: getPlaceLabel(message.trip.fromPlace),
      toPlace: getPlaceLabel(message.trip.toPlace),
      successfulMessagesToday: 1,
      quotaMessagesToday: 1,
      lastUsedAt: message.createdAt,
    });
  }

  const aiChatUsageSnapshot = await getAiChatLimitUsageSnapshot({
    userId,
    tripIds: usageTrips.map((trip) => trip.id),
  });

  if (aiChatUsageSnapshot) {
    for (const trip of usageTrips) {
      const quotaMessagesToday =
        aiChatUsageSnapshot.tripDailyUsedByTripId[trip.id] ?? 0;

      if (quotaMessagesToday <= 0 || aiAssistantTripUsageMap.has(trip.id)) {
        continue;
      }

      aiAssistantTripUsageMap.set(trip.id, {
        tripId: trip.id,
        title: trip.title,
        fromPlace: getPlaceLabel(trip.fromPlace),
        toPlace: getPlaceLabel(trip.toPlace),
        successfulMessagesToday: 0,
        quotaMessagesToday,
        lastUsedAt: trip.updatedAt,
      });
    }
  }

  const aiAssistantRecentTripUsage = Array.from(
    aiAssistantTripUsageMap.values()
  )
    .map((trip) => ({
      ...trip,
      quotaMessagesToday:
        aiChatUsageSnapshot?.tripDailyUsedByTripId[trip.tripId] ??
        trip.successfulMessagesToday,
    }))
    .sort(
      (left, right) =>
        right.quotaMessagesToday - left.quotaMessagesToday ||
        right.lastUsedAt.getTime() - left.lastUsedAt.getTime()
    )
    .slice(0, 5);

  const aiAssistantMessagesToday =
    aiChatUsageSnapshot?.userDailyUsed ?? dbAiAssistantMessagesToday;
  const aiAssistantMessagesLastMinute =
    aiChatUsageSnapshot?.burstUsed ?? dbAiAssistantMessagesLastMinute;
  const aiAssistantTripMessagesToday = aiAssistantRecentTripUsage.reduce(
    (max, trip) => Math.max(max, trip.quotaMessagesToday),
    0
  );

  return (
    <div className="min-h-screen bg-dashboard px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-310 space-y-6">
        <header className="border-b border-border pb-5">
          <p className="text-xs font-black uppercase text-muted-foreground">
            Your account
          </p>

          <h1 className="mt-1 text-3xl font-black text-foreground">Profile</h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary-foreground">
            Manage your display name and review the journeys you have planned
            with Kartografer.
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

        <UsageOverviewSection
          aiGeneratedTripsToday={aiGeneratedTripsToday}
          longAiGeneratedTripsToday={longAiGeneratedTripsToday}
          manualTripsToday={manualTripsToday}
          aiAssistantMessagesToday={aiAssistantMessagesToday}
          aiAssistantTripMessagesToday={aiAssistantTripMessagesToday}
          aiAssistantMessagesLastMinute={aiAssistantMessagesLastMinute}
          publicExploreTrips={publicExploreTrips}
          publicSharedTrips={publicSharedTrips}
          totalTrips={totalTrips}
        />

        <AiAssistantTripUsageSection trips={aiAssistantRecentTripUsage} />

        <ProfileStatsGrid
          totalTrips={totalTrips}
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