"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BedDouble,
  Check,
  Download,
  FileText,
  IndianRupee,
  MapPin,
  Route,
  Sparkles,
  Utensils,
} from "lucide-react";

const exportOptions = [
  "Day-wise plan",
  "Stays & transport",
  "Meals & activities",
  "Hidden spots",
  "Estimated costs",
  "Day notes",
];

const pdfRows = [
  {
    day: "Day 1",
    title: "Ahmedabad to Delhi",
    meta: "Flight transfer - evening buffer",
    cost: "Rs 6,400",
  },
  {
    day: "Day 2",
    title: "Delhi to Manali",
    meta: "Overnight bus - local dinner",
    cost: "Rs 2,850",
  },
  {
    day: "Day 8",
    title: "Leh to Nubra Valley",
    meta: "Shared taxi - Hunder stay",
    cost: "Rs 4,900",
  },
];

const pdfItems = [
  {
    label: "Transport",
    value: "Shared taxi + bus routes",
    icon: Route,
    tone: "bg-[#e2eee3] text-[#426948]",
  },
  {
    label: "Stay",
    value: "Budget stays selected",
    icon: BedDouble,
    tone: "bg-[#f3e5d0] text-[#5b351a]",
  },
  {
    label: "Meals",
    value: "Vegetarian stops included",
    icon: Utensils,
    tone: "bg-[#f5e8cf] text-[#8b5c25]",
  },
  {
    label: "Budget",
    value: "Rs 70,000 planned",
    icon: IndianRupee,
    tone: "bg-[#f2e0db] text-[#994232]",
  },
];

const OPTION_START_DELAY = 700;
const OPTION_STEP_DELAY = 850;
const READY_DELAY_AFTER_OPTIONS = 1100;
const READY_HOLD_DURATION = 4500;
const RESTART_DELAY = 900;

export default function LandingExportPdf() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const [hasEntered, setHasEntered] = useState(false);
  const [activeOption, setActiveOption] = useState(0);
  const [buttonState, setButtonState] = useState<"preparing" | "ready">(
    "preparing",
  );
  const [cycleKey, setCycleKey] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setHasEntered(true);
      setActiveOption(exportOptions.length);
      setButtonState("ready");
      return;
    }

    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEntered(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.3,
      },
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (!hasEntered || shouldReduceMotion) return;

    let cancelled = false;
    const timeoutIds: number[] = [];

    function wait(ms: number) {
      return new Promise<void>((resolve) => {
        const timeoutId = window.setTimeout(resolve, ms);
        timeoutIds.push(timeoutId);
      });
    }

    async function runLoop() {
      while (!cancelled) {
        setCycleKey((current) => current + 1);
        setActiveOption(0);
        setButtonState("preparing");

        await wait(OPTION_START_DELAY);
        if (cancelled) return;

        for (let index = 0; index < exportOptions.length; index += 1) {
          setActiveOption(index + 1);
          await wait(OPTION_STEP_DELAY);
          if (cancelled) return;
        }

        await wait(READY_DELAY_AFTER_OPTIONS);
        if (cancelled) return;

        setButtonState("ready");

        await wait(READY_HOLD_DURATION);
        if (cancelled) return;

        setButtonState("preparing");

        await wait(RESTART_DELAY);
      }
    }

    runLoop();

    return () => {
      cancelled = true;
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [hasEntered, shouldReduceMotion]);

  const buttonLabel =
    buttonState === "preparing" ? "Preparing PDF..." : "PDF Ready";

  return (
    <section
      ref={sectionRef}
      id="export-pdf"
      className="relative overflow-hidden border-b border-[#e8dbc8] bg-[#fffdf9] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="landing-map-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-white via-[#fffdf9]/90 to-transparent" />
      <div className="pointer-events-none absolute -right-32 top-24 h-96 w-96 rounded-full bg-[#f0d7ab]/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 bottom-16 h-96 w-96 rounded-full bg-[#d6a84f]/12 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#dcc6a8] bg-white/85 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#9b6034] shadow-sm backdrop-blur">
            <FileText className="h-3.5 w-3.5" />
            Export ready
          </div>

          <h2 className="text-3xl font-black leading-tight tracking-[-0.04em] text-[#2d1e11] sm:text-5xl lg:text-[3.4rem]">
            Turn your final itinerary into a clean PDF.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm font-semibold leading-6 text-[#806a55] sm:text-base sm:leading-7">
            Share the final plan with friends, family, or keep it offline while
            traveling - with days, stays, transport, meals, hidden spots, notes,
            and costs organized clearly.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-4xl border border-[#e0c8a7] bg-white/86 p-4 shadow-[0_24px_70px_rgba(91,53,26,0.10)] backdrop-blur sm:p-6"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#ead9c0] pb-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9b6034]">
                  Export itinerary
                </p>
                <h3 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#2d1e11]">
                  Choose what goes into the travel PDF.
                </h3>
              </div>

              <span className="rounded-full bg-[#f3e5d0] px-3 py-1.5 text-xs font-black text-[#5b351a]">
                PDF
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {exportOptions.map((option, index) => {
                const checked = activeOption > index;

                return (
                  <motion.div
                    key={`${option}-${cycleKey}`}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      backgroundColor: checked ? "#fff7e8" : "#ffffff",
                      borderColor: checked ? "#d8bd98" : "#ead9c0",
                    }}
                    transition={{
                      opacity: { duration: 0.3, delay: index * 0.04 },
                      y: { duration: 0.3, delay: index * 0.04 },
                      backgroundColor: { duration: 0.35 },
                      borderColor: { duration: 0.35 },
                    }}
                    className="flex items-center gap-3 rounded-2xl border px-3.5 py-3"
                  >
                    <motion.span
                      animate={{
                        backgroundColor: checked ? "#5b351a" : "#f8f1e6",
                        color: checked ? "#ffffff" : "#b0926e",
                        scale: checked ? [1, 1.12, 1] : 1,
                      }}
                      transition={{ duration: 0.35 }}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full shadow-[0_0_0_5px_rgba(91,53,26,0.04)]"
                    >
                      <AnimatePresence mode="wait">
                        {checked ? (
                          <motion.span
                            key="checked"
                            initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.6 }}
                            transition={{ duration: 0.22 }}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </motion.span>
                        ) : null}
                      </AnimatePresence>
                    </motion.span>

                    <span className="text-sm font-black text-[#3c2818]">
                      {option}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-6 rounded-3xl border border-[#ead9c0] bg-[#fffaf3] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase text-[#9b6034]">
                    Output style
                  </p>
                  <p className="mt-1 text-sm font-black text-[#2d1e11]">
                    Clean travel document
                  </p>
                </div>

                <div className="flex gap-2">
                  <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black text-[#5b351a] shadow-sm">
                    A4
                  </span>
                  <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black text-[#5b351a] shadow-sm">
                    Offline
                  </span>
                </div>
              </div>
            </div>

            <motion.button
              type="button"
              animate={
                buttonState === "ready" && !shouldReduceMotion
                  ? {
                      scale: [1, 1.025, 1],
                      boxShadow: [
                        "0 18px 45px rgba(91,53,26,0.22)",
                        "0 24px 60px rgba(91,53,26,0.30)",
                        "0 18px 45px rgba(91,53,26,0.22)",
                      ],
                    }
                  : undefined
              }
              whileHover={shouldReduceMotion ? undefined : { y: -2 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              transition={{ duration: 1.8, repeat: buttonState === "ready" ? Infinity : 0 }}
              className={`mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-black text-white shadow-[0_18px_45px_rgba(91,53,26,0.22)] transition ${
                buttonState === "ready"
                  ? "bg-[#416847] hover:bg-[#4f7a56]"
                  : "bg-[#5b351a] hover:bg-[#704522]"
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {buttonState === "preparing" ? (
                  <motion.span
                    key="spinner"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  />
                ) : (
                  <motion.span
                    key="download"
                    initial={{ opacity: 0, scale: 0.7, y: 3 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.7, y: -3 }}
                  >
                    <Download className="h-4 w-4" />
                  </motion.span>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={buttonLabel}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  {buttonLabel}
                </motion.span>
              </AnimatePresence>
            </motion.button>

            <Link
              href="/signup"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#d8c2a4] bg-white px-6 py-3 text-sm font-black text-[#5b351a] transition hover:bg-[#fff4e2]"
            >
              Create a trip to export PDF
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 32, rotate: -1.5 }}
            whileInView={
              shouldReduceMotion ? undefined : { opacity: 1, y: 0, rotate: 0 }
            }
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative min-h-170 lg:min-h-190"
          >
            <div className="absolute left-8 top-8 h-[88%] w-[80%] rotate-[-5deg] rounded-[28px] border border-[#ead9c0] bg-white/70 shadow-[0_30px_80px_rgba(91,53,26,0.10)]" />
            <div className="absolute right-8 top-4 h-[90%] w-[82%] rotate-[4deg] rounded-[28px] border border-[#ead9c0] bg-[#fff7e8] shadow-[0_30px_80px_rgba(91,53,26,0.10)]" />

            <AnimatePresence mode="wait">
              <motion.div
                key={`pdf-preview-${cycleKey}`}
                initial={
                  shouldReduceMotion
                    ? false
                    : { opacity: 0, y: 22, scale: 0.985, rotate: -0.6 }
                }
                animate={
                  shouldReduceMotion
                    ? undefined
                    : { opacity: 1, y: 0, scale: 1, rotate: 0 }
                }
                exit={
                  shouldReduceMotion
                    ? undefined
                    : { opacity: 0, y: -14, scale: 0.985, rotate: 0.4 }
                }
                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="relative mx-auto max-w-140 rounded-4xl border border-[#d8c2a4] bg-white p-5 shadow-[0_34px_100px_rgba(91,53,26,0.20)] sm:p-7"
              >
                <div className="flex items-center justify-between gap-4 border-b border-[#ead9c0] pb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f3e5d0] text-[#5b351a]">
                      <MapPin className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-sm font-black text-[#2d1e11]">
                        Kartografer
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9b6034]">
                        Travel PDF
                      </p>
                    </div>
                  </div>

                  <FileText className="h-5 w-5 text-[#9b6034]" />
                </div>

                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.45 }}
                  className="py-5"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9b6034]">
                    Final itinerary
                  </p>

                  <h3 className="mt-2 text-2xl font-black leading-tight tracking-[-0.03em] text-[#2d1e11]">
                    Ahmedabad to Ladakh: 15-Day Himalayan Budget Adventure
                  </h3>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {["15 days", "1 person", "Rs 70,000 budget"].map((chip) => (
                      <span
                        key={chip}
                        className="rounded-full bg-[#f3e5d0] px-3 py-1.5 text-[10px] font-black text-[#5b351a]"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </motion.div>

                <div className="space-y-3">
                  {pdfRows.map((row, index) => (
                    <motion.div
                      key={`${cycleKey}-${row.day}`}
                      initial={
                        shouldReduceMotion ? false : { opacity: 0, x: 18 }
                      }
                      animate={
                        shouldReduceMotion ? undefined : { opacity: 1, x: 0 }
                      }
                      transition={{
                        delay: 0.28 + index * 0.13,
                        duration: 0.45,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="rounded-2xl border border-[#ead9c0] bg-[#fffaf3] p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase text-[#9b6034]">
                            {row.day}
                          </p>
                          <p className="mt-1 text-sm font-black text-[#2d1e11]">
                            {row.title}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-[#806a55]">
                            {row.meta}
                          </p>
                        </div>

                        <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-black text-[#5b351a] shadow-sm">
                          {row.cost}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                  animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                  transition={{ delay: 0.72, duration: 0.5 }}
                  className="mt-5 grid gap-2 sm:grid-cols-2"
                >
                  {pdfItems.map((item, index) => {
                    const Icon = item.icon;

                    return (
                      <motion.div
                        key={`${cycleKey}-${item.label}`}
                        initial={
                          shouldReduceMotion ? false : { opacity: 0, y: 10 }
                        }
                        animate={
                          shouldReduceMotion
                            ? undefined
                            : { opacity: 1, y: 0 }
                        }
                        transition={{
                          delay: 0.84 + index * 0.08,
                          duration: 0.4,
                        }}
                        className="rounded-2xl border border-[#ead9c0] bg-white p-3"
                      >
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${item.tone}`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>

                        <p className="mt-3 text-[10px] font-black uppercase text-[#9b6034]">
                          {item.label}
                        </p>
                        <p className="mt-1 text-xs font-bold text-[#2d1e11]">
                          {item.value}
                        </p>
                      </motion.div>
                    );
                  })}
                </motion.div>

                <motion.div
                  initial={
                    shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }
                  }
                  animate={
                    shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }
                  }
                  transition={{ delay: 1.1, duration: 0.5 }}
                  className="mt-5 rounded-3xl bg-[#5b351a] p-5 text-white"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase text-[#e4c399]">
                      Cost summary
                    </p>

                    <Sparkles className="h-4 w-4 text-[#e4c399]" />
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <SummaryItem label="Used" value="Rs 42,740" />
                    <SummaryItem label="Remaining" value="Rs 27,260" />
                    <SummaryItem label="Status" value="Friendly" />
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase text-[#e4c399]">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}