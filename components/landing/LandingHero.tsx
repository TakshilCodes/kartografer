"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  BusFront,
  CalendarDays,
  Check,
  IndianRupee,
  LoaderCircle,
  MapPin,
  PencilLine,
  Route,
  Sparkles,
  Utensils,
} from "lucide-react";

import BorderGlow from "@/components/landing/BorderGlow";
import ShinyText from "@/components/landing/ShinyText";

const phases = [
  { label: "Idea", duration: 3400 },
  { label: "Mapping", duration: 2000 },
  { label: "Itinerary", duration: 3600 },
];

const heroDays = [
  {
    day: "Day 1",
    title: "Arrive in Srinagar",
    icon: BusFront,
    tone: "bg-[#e2eee3] text-[#426948]",
  },
  {
    day: "Day 2",
    title: "Gulmarg highlands",
    icon: MapPin,
    tone: "bg-[#f2e0db] text-[#994232]",
  },
  {
    day: "Day 3",
    title: "Pahalgam valley",
    icon: BedDouble,
    tone: "bg-[#e0eaec] text-[#456b76]",
  },
];

const trustChips = ["Editable days", "Realistic costs", "Template ready"];

export default function LandingHero() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPhase((current) => (current + 1) % phases.length);
    }, phases[phase].duration);

    return () => window.clearTimeout(timeout);
  }, [phase]);

  return (
    <section className="landing-hero relative isolate overflow-hidden border-b border-[#e8dbc8] bg-[#fffdf9] px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-32 lg:px-8">
      <div className="landing-map-grid pointer-events-none absolute inset-0 opacity-45" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-linear-to-b from-white to-transparent" />
      <div className="pointer-events-none absolute -right-28 top-24 h-72 w-72 rounded-full bg-[#f0d7ab]/35 blur-3xl" />

      <div className="relative mx-auto grid min-h-180 max-w-7xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        <div className="relative z-20 mx-auto max-w-2xl pt-4 text-center lg:mx-0 lg:text-left">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e2cdae] bg-[#fffaf2]/90 px-2 py-1.5 shadow-sm backdrop-blur">
            <span className="rounded-full bg-[#2d1e11] px-2.5 py-1 text-[10px] font-black uppercase text-white">
              New
            </span>
            <ShinyText
              text="Just shipped v1.0"
              speed={4}
              delay={2.5}
              color="#9b6034"
              shineColor="#2d1e11"
              spread={90}
              direction="left"
              className="pr-2 text-xs font-extrabold leading-none tracking-[0.01em]"
            />
          </div>

          <h1 className="mx-auto max-w-3xl text-4xl font-black leading-[1.04] tracking-[-0.04em] text-[#2d1e11] sm:text-5xl lg:mx-0 lg:text-6xl">
            Turn a rough travel idea into a trip you can shape.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base font-semibold leading-7 text-[#765f49] lg:mx-0">
            Kartografer drafts routes, stays, meals, transport, hidden spots,
            and costs into one clean itinerary, then lets you shape every detail
            yourself.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              href="/signup"
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#5b351a] px-6 text-sm font-extrabold text-white shadow-[0_16px_38px_rgba(91,53,26,0.22)] transition hover:-translate-y-0.5 hover:bg-[#704522]"
            >
              Start planning
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>

            <Link
              href="#product-story"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#d8c2a4] bg-white/80 px-6 text-sm font-extrabold text-[#5b351a] transition hover:bg-[#f6ead7]"
            >
              See how it works
            </Link>
          </div>

          <div className="mt-7 hidden flex-wrap justify-center gap-2 sm:flex lg:justify-start">
            {trustChips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center gap-2 rounded-full border border-[#ead9c0] bg-white/70 px-3 py-1.5 text-xs font-bold text-[#765f49]"
              >
                <Check className="h-3.5 w-3.5 text-[#5b351a]" />
                {chip}
              </span>
            ))}
          </div>
        </div>

        <HeroProductSimulation phase={phase} />
      </div>
    </section>
  );
}

function HeroProductSimulation({ phase }: { phase: number }) {
  return (
    <div className="relative z-10 mx-auto h-90 w-full max-w-162.5 sm:h-107.5 lg:h-125">
      <BorderGlow
        className="absolute inset-0 h-full w-full"
        backgroundColor="#f5e8d5"
        borderRadius={38}
        glowColor="36 72 56"
        glowRadius={46}
        glowIntensity={0.95}
        coneSpread={31}
        fillOpacity={0.14}
        colors={["#d6a84f", "#8f5630", "#6f8f5f"]}
      >
        <div className="relative h-full w-full overflow-hidden rounded-[38px] bg-[#f5e8d5]/94">
          <div className="landing-map-grid absolute inset-0 opacity-55" />

          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 700 520"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M68 395 C155 302 238 404 332 268 S525 112 633 185"
              stroke="rgba(91,53,26,0.14)"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              className="landing-hero-route"
              d="M68 395 C155 302 238 404 332 268 S525 112 633 185"
              stroke="#704522"
              strokeWidth="3"
              strokeDasharray="10 12"
              strokeLinecap="round"
            />
          </svg>

          <div className="absolute left-4 top-4 z-30 flex items-center gap-2 rounded-full border border-[#dfc9aa] bg-white/90 px-3 py-2 shadow-sm backdrop-blur sm:left-6 sm:top-6">
            <Sparkles className="h-3.5 w-3.5 text-[#8e5b2d]" />
            <span
              key={phase}
              className="landing-hero-status-label text-[10px] font-black uppercase text-[#65401f]"
            >
              {phase === 0
                ? "Reading your idea"
                : phase === 1
                  ? "Mapping the trip"
                  : "Draft ready to edit"}
            </span>
          </div>

          <div className="absolute right-4 top-5 z-30 flex gap-1.5 sm:right-6 sm:top-7">
            {phases.map((item, index) => (
              <span
                key={item.label}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  index === phase
                    ? "w-7 bg-[#5b351a]"
                    : index < phase
                      ? "w-3 bg-[#7b9a72]"
                      : "w-1.5 bg-[#d5bea0]"
                }`}
              />
            ))}
          </div>

          <span className="absolute bottom-[12%] left-[7%] z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#5b351a] text-white shadow-lg sm:h-10 sm:w-10">
            <MapPin className="h-4 w-4" />
          </span>

          <span className="absolute right-[6%] top-[34%] z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#a44732] text-white shadow-lg sm:h-10 sm:w-10">
            <MapPin className="h-4 w-4" />
          </span>

          <div className="absolute inset-x-3 bottom-5 top-16 z-20 overflow-hidden sm:inset-x-7 sm:bottom-7 sm:top-18 lg:top-20">
            <div
              key={phase}
              className={`landing-hero-phase landing-hero-phase-${phase}`}
            >
              <div className="landing-hero-phase-sheen" />

              {phase === 0 ? <IdeaPhase /> : null}
              {phase === 1 ? <MappingPhase /> : null}
              {phase === 2 ? <ItineraryPhase /> : null}
            </div>
          </div>
        </div>
      </BorderGlow>

      <div className="pointer-events-none absolute -bottom-5 left-1/2 h-12 w-[72%] -translate-x-1/2 rounded-full bg-[#5b351a]/14 blur-2xl" />
    </div>
  );
}

function HeroPhaseShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="flex h-full w-full items-center justify-center px-2 pb-4 pt-8 sm:px-4 sm:pb-5 sm:pt-10 lg:pt-12">
      <div className={`w-full ${className}`}>{children}</div>
    </div>
  );
}

function IdeaPhase() {
  return (
    <HeroPhaseShell className="max-w-115">
      <div className="landing-hero-idea rounded-2xl border border-[#dfc9ac] bg-white/94 p-4 shadow-[0_22px_48px_rgba(83,51,24,0.15)] backdrop-blur sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[9px] font-black uppercase text-[#9a7855]">
            Your rough trip idea
          </p>

          <span className="rounded-full bg-[#f3e5d0] px-2.5 py-1 text-[8px] font-black text-[#65401f]">
            Step 1
          </span>
        </div>

        <div className="mt-3 min-h-16 rounded-xl border border-[#e5d4bd] bg-[#fffaf3] px-3 py-3 text-sm font-bold leading-5 text-[#3c2818] sm:text-base">
          <span className="landing-hero-typed-text">
            Plan a relaxed 7-day Kashmir trip from Ahmedabad for 3 people under
            INR 60,000.
          </span>
          <span className="landing-hero-caret" />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
          <span className="rounded-xl bg-[#f8f1e6] px-2.5 py-2 text-[9px] font-black text-[#765f49]">
            Balanced pace
          </span>
          <span className="rounded-xl bg-[#f8f1e6] px-2.5 py-2 text-[9px] font-black text-[#765f49]">
            Vegetarian
          </span>
          <span className="rounded-xl bg-[#f8f1e6] px-2.5 py-2 text-[9px] font-black text-[#765f49]">
            Shared taxi
          </span>
        </div>

        <button
          type="button"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#5b351a] px-4 py-3 text-[10px] font-black text-white shadow-[0_14px_30px_rgba(91,53,26,0.2)]"
        >
          Generate trip
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </HeroPhaseShell>
  );
}

function MappingPhase() {
  const statuses = [
    {
      label: "Mapping route...",
      icon: Route,
      tone: "text-[#456b76] bg-[#e0eaec]",
    },
    {
      label: "Adding stays...",
      icon: BedDouble,
      tone: "text-[#426948] bg-[#e2eee3]",
    },
    {
      label: "Planning meals...",
      icon: Utensils,
      tone: "text-[#8b5c25] bg-[#f5e8cf]",
    },
    {
      label: "Estimating cost...",
      icon: IndianRupee,
      tone: "text-[#994232] bg-[#f2e0db]",
    },
  ];

  return (
    <HeroPhaseShell className="max-w-107.5">
      <div className="rounded-2xl border border-[#dfc9ac] bg-white/94 p-4 shadow-[0_22px_48px_rgba(83,51,24,0.15)] backdrop-blur sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5b351a] text-white">
            <LoaderCircle className="h-5 w-5 animate-spin" />
          </span>

          <div>
            <p className="text-[9px] font-black uppercase text-[#9a7855]">
              AI mapping
            </p>
            <h3 className="text-sm font-black text-[#2d1e11]">
              Building a practical route
            </h3>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
          {statuses.map((status, index) => {
            const Icon = status.icon;

            return (
              <div
                key={status.label}
                className="landing-hero-status flex items-center gap-2 rounded-xl border border-[#eadcca] bg-[#fffdf9] p-2.5"
                style={{ animationDelay: `${index * 220}ms` }}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${status.tone}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>

                <span className="text-[9px] font-black text-[#65401f]">
                  {status.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </HeroPhaseShell>
  );
}

function ItineraryPhase() {
  return (
    <HeroPhaseShell className="max-w-125">
      <div className="rounded-2xl border border-[#dfc9ac] bg-white/94 p-3.5 shadow-[0_22px_48px_rgba(83,51,24,0.15)] backdrop-blur sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase text-[#9a7855]">
              First draft ready
            </p>

            <h3 className="mt-1 text-sm font-black text-[#2d1e11] sm:text-base">
              Kashmir family escape
            </h3>
          </div>

          <span className="shrink-0 rounded-full bg-[#e3eee4] px-2.5 py-1 text-[8px] font-black text-[#426948]">
            Budget on track
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 min-[500px]:grid-cols-3">
          {heroDays.map((item, index) => {
            const Icon = item.icon;

            return (
              <article
                key={item.day}
                className="landing-hero-day rounded-xl border border-[#e6d5bd] bg-[#fffaf3] p-2.5 sm:p-3"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase text-[#9a7855]">
                    {item.day}
                  </span>

                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-md ${item.tone}`}
                  >
                    <Icon className="h-3 w-3" />
                  </span>
                </div>

                <p className="mt-3 text-[10px] font-black leading-4 text-[#2d1e11] sm:text-[11px]">
                  {item.title}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-[#eadcca] pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[#65401f]">
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="text-[9px] font-bold">7 days · 3 travelers</span>
          </div>

          <span className="landing-hero-edit-chip inline-flex w-fit items-center gap-1.5 rounded-full bg-[#5b351a] px-3 py-2 text-[9px] font-black text-white">
            <PencilLine className="h-3 w-3" />
            Edit Day 2
          </span>
        </div>
      </div>
    </HeroPhaseShell>
  );
}