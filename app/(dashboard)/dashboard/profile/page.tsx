import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  Bot,
  FileDown,
  Globe2,
  Link2,
  Map,
  MessageSquareText,
  PencilLine,
  Route,
  ShieldCheck,
  Zap,
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

  const progressBarClass =
    tone === "primary"
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
          </div>
        ) : null}
      </div>
    </div>
  );
}

function LimitInfoCard({
  icon,
  label,
  value,
  description,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card-secondary text-primary">
          {icon}
        </div>

        <p className="text-xl font-black text-foreground">{value}</p>
      </div>

      <p className="text-xs font-black uppercase tracking-[0.14em] text-secondary-foreground">
        {label}
      </p>

      <p className="mt-1.5 text-xs font-semibold leading-5 text-secondary-foreground">
        {description}
      </p>
    </div>
  );
}

function UsageOverviewSection({
  aiGeneratedTripsToday,
  longAiGeneratedTripsToday,
  manualTripsToday,
  publicExploreTrips,
  publicSharedTrips,
  totalTrips,
}: {
  aiGeneratedTripsToday: number;
  longAiGeneratedTripsToday: number;
  manualTripsToday: number;
  publicExploreTrips: number;
  publicSharedTrips: number;
  totalTrips: number;
}) {
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
          icon={<Map className="h-5 w-5" />}
          label="Total trips"
          value={totalTrips}
          description="All trips created in your Kartografer workspace."
        />
      </div>

      <div className="border-t border-border bg-card-secondary/20 px-5 py-4 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-foreground">
              AI assistant limits
            </p>

            <p className="mt-1 text-xs font-semibold leading-5 text-secondary-foreground">
              Chat limits protect your AI budget and prevent spammy repeated
              requests.
            </p>
          </div>

          <span className="hidden rounded-full border border-border bg-card px-3 py-1.5 text-xs font-black text-secondary-foreground sm:inline-flex">
            Per 24 hours
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <LimitInfoCard
            icon={<MessageSquareText className="h-4 w-4" />}
            label="AI chat / user"
            value={AI_CHAT_USER_DAILY_LIMIT}
            description="Maximum AI chat messages per user per day."
          />

          <LimitInfoCard
            icon={<Map className="h-4 w-4" />}
            label="AI chat / trip"
            value={AI_CHAT_TRIP_DAILY_LIMIT}
            description="Maximum AI chat messages allowed inside one trip per day."
          />

          <LimitInfoCard
            icon={<Zap className="h-4 w-4" />}
            label="Burst protection"
            value={`${AI_CHAT_BURST_LIMIT}/min`}
            description="Short-term rate limit to prevent repeated rapid requests."
          />
        </div>
      </div>

      <div className="border-t border-border bg-card-secondary/30 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-card text-primary">
              <FileDown className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-black text-foreground">PDF exports</p>

              <p className="mt-1 max-w-2xl text-xs font-semibold leading-5 text-secondary-foreground">
                PDF export tracking can be added later when you introduce
                premium limits, subscriptions, or usage history.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-black text-secondary-foreground">
              Unlimited for now
            </span>

            <span className="rounded-full bg-card px-3 py-1.5 text-xs font-black text-primary">
              Premium-ready
            </span>
          </div>
        </div>
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

  const totalDaysPlanned = tripTotals._sum.daysCount ?? 0;

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
          publicExploreTrips={publicExploreTrips}
          publicSharedTrips={publicSharedTrips}
          totalTrips={totalTrips}
        />

        <ProfileStatsGrid
          totalTrips={totalTrips}
          aiGeneratedTrips={aiGeneratedTrips}
          publicSharedTrips={publicSharedTrips}
          draftTrips={draftTrips}
          totalDaysPlanned={totalDaysPlanned}
          lastTripUpdatedAt={latestTrips[0]?.updatedAt.toISOString() ?? null}
        />

        <LatestTripsPanel trips={latestTripCards} />
      </div>
    </div>
  );
}