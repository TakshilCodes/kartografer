"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import ShinyText from "@/components/landing/ShinyText";
import {
  ArrowRight,
  Compass,
  FileText,
  Map,
  Sparkles,
  WalletCards,
} from "lucide-react";

const ctaFeatures = [
  {
    icon: Sparkles,
    label: "AI first draft",
  },
  {
    icon: Map,
    label: "Editable itinerary",
  },
  {
    icon: WalletCards,
    label: "Cost tracking",
  },
  {
    icon: FileText,
    label: "PDF export",
  },
];

export default function LandingFinalCta() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-[#fffaf3] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="landing-map-grid pointer-events-none absolute inset-0 opacity-35" />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-linear-to-b from-white via-[#fffaf3]/90 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-16 h-112 w-md -translate-x-1/2 rounded-full bg-[#f0d7ab]/55 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/2 h-96 w-176 -translate-x-1/2 rounded-full bg-[#5b351a]/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-[40px] border border-[#dcc6a8] bg-white/86 px-5 py-10 shadow-[0_30px_100px_rgba(91,53,26,0.12)] backdrop-blur sm:px-8 sm:py-14 lg:px-14 lg:py-16"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(240,215,171,0.55),transparent_42%)]" />

          <motion.div
            aria-hidden="true"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.94 }}
            whileInView={
              shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }
            }
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="absolute left-1/2 top-8 hidden h-72 w-72 -translate-x-1/2 rounded-full border border-[#ead9c0] lg:block"
          />

          <motion.div
            aria-hidden="true"
            initial={shouldReduceMotion ? false : { pathLength: 0 }}
            whileInView={shouldReduceMotion ? undefined : { pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.8, delay: 0.25, ease: "easeInOut" }}
            className="pointer-events-none absolute inset-x-0 top-24 hidden justify-center lg:flex"
          >
            <svg
              width="560"
              height="160"
              viewBox="0 0 560 160"
              fill="none"
              className="text-[#c9964c]"
            >
              <motion.path
                d="M35 118 C 120 28, 210 138, 294 68 S 445 42, 525 104"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="8 12"
                initial={shouldReduceMotion ? false : { pathLength: 0 }}
                whileInView={shouldReduceMotion ? undefined : { pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.8, delay: 0.25, ease: "easeInOut" }}
              />
            </svg>
          </motion.div>

          <div className="relative mx-auto max-w-4xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dcc6a8] bg-[#fffaf3]/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#9b6034] shadow-sm">
              <Compass className="h-3.5 w-3.5" />
              Start mapping
            </div>

            <h2 className="text-3xl font-black leading-tight tracking-[-0.045em] text-[#2d1e11] sm:text-5xl lg:text-[4rem]">
              Build the trip first. Polish the plan later.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-sm font-semibold leading-6 text-[#806a55] sm:text-base sm:leading-7">
              Give Kartografer a rough idea and turn it into an editable,
              day-wise itinerary with stays, transport, meals, activities,
              notes, costs, and export-ready structure.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#5b351a] px-6 text-sm font-black text-white shadow-[0_18px_45px_rgba(91,53,26,0.24)] transition hover:-translate-y-0.5 hover:bg-[#704522] sm:w-auto"
              >
                Start planning for free
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/explore"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-[#d8c2a4] bg-white px-6 text-sm font-black text-[#5b351a] transition hover:-translate-y-0.5 hover:bg-[#fff4e2] sm:w-auto"
              >
                Explore templates
              </Link>
            </div>

            <p className="mt-7 text-xs font-bold text-[#9b846c]">
              No perfect prompt needed. Start messy, then shape the itinerary.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}