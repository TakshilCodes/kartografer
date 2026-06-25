"use client";

import { useEffect, useState } from "react";
import {
  ArchiveRestore,
  BedDouble,
  Bot,
  BusFront,
  CalendarDays,
  Check,
  Ellipsis,
  IndianRupee,
  LoaderCircle,
  MapPin,
  Pencil,
  Route,
  Send,
  Sparkles,
  Trash2,
  Users,
  Utensils,
  WandSparkles,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";

import BorderGlow from "@/components/landing/BorderGlow";

const STEP_DURATION = 7000;

const storySteps = [
  {
    number: "01",
    title: "Describe the journey",
    text: "Choose the route, duration, travelers, budget, pace, food, and transport preferences.",
  },
  {
    number: "02",
    title: "Receive a mapped first draft",
    text: "AI organizes selected items and backup options into continuous travel days.",
  },
  {
    number: "03",
    title: "Edit without starting again",
    text: "Move suggestions into the plan, change details manually, or ask AI to propose safe changes.",
  },
];

const previewDays = [
  {
    tab: "Day 1",
    title: "Arrive in Srinagar",
    description: "Settle into Dal Lake and keep the first evening gentle.",
    cost: "INR 6,900",
    items: [
      { type: "Transport", title: "Airport cab to Dal Lake", icon: BusFront, tone: "green" },
      { type: "Stay", title: "Houseboat check-in", icon: BedDouble, tone: "blue" },
      { type: "Activity", title: "Evening shikara ride", icon: MapPin, tone: "red" },
      { type: "Meal", title: "Kashmiri dinner", icon: Utensils, tone: "amber" },
    ],
  },
  {
    tab: "Day 2",
    title: "Gulmarg highlands",
    description: "Gondola views, a warm local lunch, and time to slow down.",
    cost: "INR 7,850",
    items: [
      { type: "Transport", title: "Shared cab to Gulmarg", icon: BusFront, tone: "green" },
      { type: "Activity", title: "Gondola Phase 1", icon: MapPin, tone: "red" },
      { type: "Meal", title: "Mountain cafe lunch", icon: Utensils, tone: "amber" },
      { type: "Stay", title: "Return to Srinagar", icon: BedDouble, tone: "blue" },
    ],
  },
  {
    tab: "Day 3",
    title: "Pahalgam valley",
    description: "Follow the Lidder River with a quieter trail before sunset.",
    cost: "INR 7,200",
    items: [
      { type: "Transport", title: "Cab through Anantnag", icon: BusFront, tone: "green" },
      { type: "Activity", title: "Aru Valley walk", icon: MapPin, tone: "red" },
      { type: "Meal", title: "Riverside lunch", icon: Utensils, tone: "amber" },
      { type: "Hidden spot", title: "Lidder sunset bend", icon: Route, tone: "blue" },
    ],
  },
];

export default function LandingProductStory() {
  const [activeStep, setActiveStep] = useState(0);
  const [cycleVersion, setCycleVersion] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setActiveStep((current) => (current + 1) % storySteps.length);
    }, STEP_DURATION);
    return () => window.clearTimeout(timeout);
  }, [activeStep, cycleVersion]);

  function selectStep(index: number) {
    setActiveStep(index);
    setCycleVersion((version) => version + 1);
  }

  return (
    <section id="product-story" className="relative overflow-hidden border-b border-[#e7d9c6] bg-white px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(to right, rgba(91, 53, 26, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(91, 53, 26, 0.07) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9b6034]">From idea to itinerary</p>
          <h2 className="mt-4 text-3xl font-black leading-tight text-[#2d1e11] sm:text-5xl">AI gives you a useful first draft. You keep the final say.</h2>
          <p className="mt-5 text-base font-semibold leading-7 text-[#806a55]">Kartografer is designed around the part most planners skip: the itinerary still needs to be understood, moved around, and made personal after it is generated.</p>
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-[0.74fr_1.26fr] lg:items-center">
          <div className="relative">
            <span
              className="landing-step-marker pointer-events-none absolute left-0 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[#cba978] bg-[#fffdf8] text-[#5b351a] shadow-[0_8px_20px_rgba(91,53,26,0.16)] transition-[top] duration-700 ease-out sm:left-1"
              style={{ top: `${activeStep * 33.333 + 16.666}%` }}
              aria-hidden="true"
            >
              <MapPin className="h-3.5 w-3.5" />
            </span>

            <div className="grid grid-rows-3 gap-2">
              {storySteps.map((step, index) => {
                const active = activeStep === index;
                return (
                  <button
                    key={step.number}
                    type="button"
                    onClick={() => selectStep(index)}
                    className={`group relative min-h-31.5 w-full cursor-pointer border-x-0 border-y px-2 py-6 pl-12 text-left transition-[border-color,background-color] duration-500 sm:pl-14 ${active ? "border-[#cda774] bg-[#fffaf2]/65" : "border-transparent bg-transparent hover:border-[#ead9c0] hover:bg-[#fffaf3]/55"}`}
                  >
                    {active ? (
                      <span className="absolute left-12 right-3 -top-px h-0.5 overflow-visible bg-[#eadbc5] sm:left-14">
                        <motion.span
                          key={`${activeStep}-${cycleVersion}`}
                          className="relative block h-full bg-[#704522]"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: prefersReducedMotion ? 0 : STEP_DURATION / 1000, ease: "linear" }}
                        >
                          <motion.span
                            className="absolute -right-1 -top-0.75 h-2 w-2 rounded-full bg-[#a97538] shadow-[0_0_0_4px_rgba(169,117,56,0.14)]"
                            animate={prefersReducedMotion ? { scale: 1, opacity: 1 } : { scale: [1, 1.35, 1], opacity: [1, 0.75, 1] }}
                            transition={prefersReducedMotion ? {} : { duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                          />
                        </motion.span>
                      </span>
                    ) : null}

                    <div className="grid grid-cols-[38px_minmax(0,1fr)] gap-3">
                      <span className={`pt-1 text-xs font-black transition-colors ${active ? "text-[#5b351a]" : "text-[#a35f34]"}`}>{step.number}</span>
                      <div>
                        <h3 className="text-lg font-black text-[#2d1e11] sm:text-xl">{step.title}</h3>
                        <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-[#806a55]">{step.text}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <BorderGlow
            className="landing-product-story-demo"
            backgroundColor="#f8efe2"
            borderRadius={34}
            glowColor="38 66 55"
            glowRadius={34}
            glowIntensity={0.72}
            edgeSensitivity={20}
            animated
            colors={["#d5a552", "#704522", "#6f8d65"]}
            fillOpacity={0.12}
          >
            <div className="relative min-h-170 overflow-hidden rounded-[34px] bg-[#f8efe2] p-3 sm:p-5">
              <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(to right, rgba(91, 53, 26, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(91, 53, 26, 0.07) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
              <div className="relative flex items-center justify-between rounded-2xl border border-[#e3d2ba] bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5b351a] text-white"><WandSparkles className="h-4 w-4" /></span>
                  <div><p className="text-[9px] font-black uppercase text-[#9a7855]">Live product tour</p><p className="text-xs font-black text-[#2d1e11]">{storySteps[activeStep].title}</p></div>
                </div>
                <div className="flex gap-1.5">{storySteps.map((step, index) => <span key={step.number} className={`h-1.5 rounded-full transition-all duration-500 ${index === activeStep ? "w-7 bg-[#5b351a]" : "w-1.5 bg-[#d7c3a7]"}`} />)}</div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeStep}-${cycleVersion}`}
                  className={`relative mt-3 ${
                    activeStep === 2
                      ? "min-h-260 md:min-h-150"
                      : "min-h-180 sm:min-h-147.5"
                  }`}
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.96, filter: "blur(8px)" }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20, scale: 0.96, filter: "blur(8px)" }}
                  transition={{ duration: prefersReducedMotion ? 0.2 : 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  {activeStep === 0 ? <TripFormDemo prefersReducedMotion={prefersReducedMotion} /> : null}
                  {activeStep === 1 ? <ItineraryPreviewDemo prefersReducedMotion={prefersReducedMotion} /> : null}
                  {activeStep === 2 ? <EditWorkspaceDemo prefersReducedMotion={prefersReducedMotion} /> : null}
                </motion.div>
              </AnimatePresence>
            </div>
          </BorderGlow>
        </div>
      </div>
    </section>
  );
}

function TripFormDemo({ prefersReducedMotion }: { prefersReducedMotion: boolean | null }) {
  const fields = [
    { label: "From place", value: "Ahmedabad", icon: MapPin },
    { label: "Destination place", value: "Kashmir", icon: Route },
    { label: "Budget", value: "INR 60,000", icon: IndianRupee },
    { label: "Number of days", value: "7 days", icon: CalendarDays },
  ];

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden rounded-2xl border border-[#e2d0b7] bg-white shadow-[0_20px_55px_rgba(83,51,24,0.12)]"
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: prefersReducedMotion ? 0.2 : 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between border-b border-[#eadcca] bg-[#fffdf9] px-5 py-4">
        <div><p className="text-[9px] font-black uppercase text-[#9b7650]">New journey</p><h3 className="mt-1 text-lg font-black text-[#2d1e11]">Tell us where you want to go</h3></div>
        <span className="hidden rounded-full bg-[#f3e7d5] px-3 py-1.5 text-[9px] font-black text-[#65401f] sm:inline-flex">AI itinerary</span>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
        {fields.map((field, index) => (
          <motion.div
            key={field.label}
            className="rounded-2xl border border-[#dfcdb3] bg-[#fffaf3] p-3.5"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.45 + index * 0.76, duration: prefersReducedMotion ? 0.2 : 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <label className="text-[9px] font-black uppercase text-[#907251]">{field.label}</label>
            <div className="mt-2 flex items-center gap-2 text-[#5b351a]">
              <field.icon className="h-4 w-4 shrink-0" />
              <motion.span
                className="truncate text-sm font-black"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: prefersReducedMotion ? 0 : 0.65 + index * 0.76, duration: prefersReducedMotion ? 0.2 : 0.3 }}
              >
                {field.value}
              </motion.span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-3 border-t border-[#eadcca] bg-[#fffdf9] px-4 py-4 sm:grid-cols-3 sm:px-5">
        <MiniPreference icon={<Users className="h-3.5 w-3.5" />} label="Travelers" value="3 people" />
        <MiniPreference icon={<Utensils className="h-3.5 w-3.5" />} label="Food" value="Vegetarian" />
        <MiniPreference icon={<Route className="h-3.5 w-3.5" />} label="Pace" value="Balanced" />
      </div>

      <div className="px-4 pb-5 pt-4 sm:px-5">
        <motion.button
          type="button"
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#5b351a] text-sm font-black text-white shadow-[0_14px_30px_rgba(91,53,26,0.2)]"
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ delay: prefersReducedMotion ? 0 : 3.5, duration: prefersReducedMotion ? 0.2 : 0.4, ease: [0.16, 1, 0.3, 1] }}
          whileHover={prefersReducedMotion ? {} : { scale: 1.02, y: -2 }}
          whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
        >
          <Sparkles className="h-4 w-4" /> Generate trip
        </motion.button>
      </div>

      <motion.div
        className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#fffdf9]/96 px-5 text-center backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: prefersReducedMotion ? 0 : 4, duration: prefersReducedMotion ? 0.2 : 0.5 }}
        exit={{ opacity: 0, transition: { duration: 0.3 } }}
      >
        <div className="relative h-28 w-full max-w-sm">
          <svg className="h-full w-full" viewBox="0 0 340 112" fill="none" aria-hidden="true">
            <path d="M25 80 C95 10 160 105 230 37 C265 4 290 35 315 20" stroke="#dfcdb2" strokeWidth="7" strokeLinecap="round" />
            <motion.path
              d="M25 80 C95 10 160 105 230 37 C265 4 290 35 315 20"
              stroke="#704522"
              strokeWidth="3"
              strokeDasharray="9 10"
              strokeLinecap="round"
              initial={{ strokeDashoffset: 0 }}
              animate={prefersReducedMotion ? { strokeDashoffset: 0 } : { strokeDashoffset: -90 }}
              transition={prefersReducedMotion ? {} : { duration: 9, repeat: Infinity, ease: "linear" }}
            />
          </svg>
          <span className="absolute bottom-3 left-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#5b351a] text-white"><MapPin className="h-3.5 w-3.5" /></span>
          <span className="absolute right-3 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-[#a54631] text-white"><MapPin className="h-3.5 w-3.5" /></span>
        </div>
        <h4 className="mt-3 text-lg font-black text-[#2d1e11]">Building your Kashmir route</h4>
        <div className="mt-5 grid w-full max-w-md grid-cols-2 gap-2 text-left">
          {["Mapping route...", "Selecting stays...", "Planning meals...", "Estimating cost..."].map((status, index) => (
            <motion.div
              key={status}
              className="flex items-center gap-2 rounded-xl border border-[#eadcca] bg-white px-3 py-2.5"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: prefersReducedMotion ? 0 : 4.85 + index * 0.38, duration: prefersReducedMotion ? 0.2 : 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {index < 2 ? <Check className="h-3.5 w-3.5 text-[#527457]" /> : <LoaderCircle className="h-3.5 w-3.5 animate-spin text-[#9b6a36]" />}
              <span className="text-[10px] font-black text-[#65401f]">{status}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ItineraryPreviewDemo({ prefersReducedMotion }: { prefersReducedMotion: boolean | null }) {
  const [dayIndex, setDayIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => setDayIndex((day) => (day + 1) % previewDays.length), 2100);
    return () => window.clearInterval(interval);
  }, []);

  const day = previewDays[dayIndex];

  return (
    <motion.div
      className="absolute inset-0 overflow-hidden rounded-2xl border border-[#e2d0b7] bg-white shadow-[0_20px_55px_rgba(83,51,24,0.12)]"
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: prefersReducedMotion ? 0.2 : 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(to right, rgba(91, 53, 26, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(91, 53, 26, 0.07) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <div className="relative border-b border-[#e6d7c3] bg-white/94 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-[9px] font-black uppercase text-[#9b7650]">Kashmir family escape</p><h3 className="mt-1 text-lg font-black text-[#2d1e11] sm:text-xl">Your mapped itinerary</h3></div>
          <span className="rounded-full bg-[#e3eee4] px-3 py-1.5 text-[9px] font-black text-[#416847]">Budget on track</span>
        </div>
        <div className="mt-4 flex gap-2 overflow-hidden">
          {previewDays.map((item, index) => (
            <button key={item.tab} type="button" onClick={() => setDayIndex(index)} className={`min-w-20 rounded-xl px-3 py-2 text-[10px] font-black transition-all ${index === dayIndex ? "bg-[#5b351a] text-white shadow-md" : "border border-[#e1cfb5] bg-[#fffaf3] text-[#765f49]"}`}>{item.tab}</button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={day.title}
          className="relative grid gap-4 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_155px]"
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }}
          transition={{ duration: prefersReducedMotion ? 0.2 : 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase text-[#a35f34]">{day.tab}</p>
            <h4 className="mt-1 text-xl font-black text-[#2d1e11]">{day.title}</h4>
            <p className="mt-2 text-xs font-semibold leading-5 text-[#806a55]">{day.description}</p>
            <div className="mt-4 space-y-2.5">
              {day.items.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: prefersReducedMotion ? 0 : index * 0.09, duration: prefersReducedMotion ? 0.2 : 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <PreviewItem {...item} />
                </motion.div>
              ))}
            </div>
          </div>

          <aside className="space-y-3">
            <div className="rounded-2xl bg-[#5b351a] p-4 text-white">
              <p className="text-[9px] font-black uppercase text-[#e4c399]">Day estimate</p>
              <p className="mt-2 text-xl font-black">{day.cost}</p>
              <p className="mt-1 text-[9px] font-semibold text-[#ead6bd]">Includes selected items</p>
            </div>
            <div className="rounded-2xl border border-[#dfceb7] bg-[#fffaf3] p-3">
              <div className="flex items-center gap-2 text-[#5b351a]"><Route className="h-3.5 w-3.5" /><p className="text-[9px] font-black uppercase">Route note</p></div>
              <p className="mt-2 text-[10px] font-semibold leading-4 text-[#806a55]">Travel order stays practical and avoids doubling back.</p>
            </div>
          </aside>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function EditWorkspaceDemo({ prefersReducedMotion }: { prefersReducedMotion: boolean | null }) {
  return (
    <motion.div
      className="absolute inset-0 overflow-hidden rounded-2xl border border-[#e2d0b7] bg-[#f7efe3] shadow-[0_20px_55px_rgba(83,51,24,0.12)]"
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: prefersReducedMotion ? 0.2 : 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between border-b border-[#e2d0b7] bg-white px-4 py-3">
        <div><p className="text-[9px] font-black uppercase text-[#9b7650]">Editing Kashmir family escape</p><p className="text-xs font-black text-[#2d1e11]">Day 2 · Gulmarg highlands</p></div>
        <span className="rounded-full bg-[#e4eee5] px-3 py-1.5 text-[9px] font-black text-[#416847]">Saved</span>
      </div>

      <div className="grid min-h-135 gap-px bg-[#dfcdb4] md:grid-cols-[155px_minmax(245px,1fr)_175px]">
        <OptionsPanel prefersReducedMotion={prefersReducedMotion} />

        <main className="min-w-0 bg-white p-3.5">
          <div className="flex gap-1.5 overflow-hidden border-b border-[#eadcca] pb-3">
            {[1, 2, 3, 4].map((day) => <span key={day} className={`min-w-14 rounded-lg px-2 py-2 text-center text-[9px] font-black ${day === 2 ? "bg-[#5b351a] text-white" : "bg-[#f6ecdd] text-[#765f49]"}`}>Day {day}</span>)}
          </div>
          <div className="mt-3 flex items-start justify-between gap-2"><div><p className="text-[9px] font-black uppercase text-[#a35f34]">Itinerary editor</p><h4 className="mt-1 text-base font-black text-[#2d1e11]">Day 2 activities</h4></div><span className="rounded-lg bg-[#f3e6d2] px-2 py-1 text-[8px] font-black text-[#65401f]">INR 7,420</span></div>

          <div className="mt-3 space-y-2">
            <EditActivity time="09:00" title="Shared cab to Gulmarg" type="Transport" />
            <div className="relative rounded-xl border border-[#d7b982] bg-[#fffaf0] p-3 shadow-[0_8px_22px_rgba(83,51,24,0.08)]">
              <div className="flex items-start justify-between gap-2">
                <div><p className="text-[8px] font-black uppercase text-[#9b7650]">11:00 · Activity</p><p className="mt-1 text-[11px] font-black text-[#2d1e11]">Gondola Phase 1</p><p className="mt-1 text-[9px] font-semibold text-[#806a55]">Views before the afternoon crowd.</p></div>
                <button type="button" aria-label="Activity actions" className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#5b351a] text-white"><Ellipsis className="h-3.5 w-3.5" /></button>
              </div>
              <motion.div
                className="absolute right-2 top-10 z-20 w-32 overflow-hidden rounded-xl border border-[#dcc6aa] bg-white p-1.5 shadow-[0_16px_35px_rgba(63,39,19,0.2)]"
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: -8 }}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: prefersReducedMotion ? 0 : 1.5, duration: prefersReducedMotion ? 0.2 : 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <MenuAction icon={<Pencil className="h-3 w-3" />} label="Edit" />
                <MenuAction icon={<ArchiveRestore className="h-3 w-3" />} label="Move to options" />
                <MenuAction icon={<Trash2 className="h-3 w-3" />} label="Delete" danger />
              </motion.div>
            </div>
            <EditActivity time="14:00" title="Mountain cafe lunch" type="Meal" />
            <EditActivity time="17:00" title="Quiet meadow walk" type="Hidden spot" />
          </div>
        </main>

        <ChatPanel prefersReducedMotion={prefersReducedMotion} />
      </div>
    </motion.div>
  );
}

function OptionsPanel({ prefersReducedMotion }: { prefersReducedMotion: boolean | null }) {
  return (
    <aside className="bg-[#fffaf3] p-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-[#a35f34]" />
        <p className="text-[10px] font-black text-[#2d1e11]">Options</p>
      </div>
      <p className="mt-1 text-[8px] font-semibold leading-3 text-[#806a55]">
        Saved alternatives outside the final plan.
      </p>
      <div className="mt-3 space-y-2">
        <motion.div
          initial={{ borderColor: "#e0cdb2" }}
          animate={prefersReducedMotion ? { borderColor: "#e0cdb2" } : { borderColor: ["#e0cdb2", "#d7b982", "#e0cdb2"] }}
          transition={prefersReducedMotion ? {} : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <OptionCard title="Budget cafe" meta="Meal | INR 550" prefersReducedMotion={prefersReducedMotion} />
        </motion.div>
        <OptionCard title="Local bus" meta="Transport | INR 180" prefersReducedMotion={prefersReducedMotion} />
        <OptionCard title="Alpine stay" meta="Stay | INR 2,800" prefersReducedMotion={prefersReducedMotion} />
      </div>
    </aside>
  );
}
function ChatPanel({ prefersReducedMotion }: { prefersReducedMotion: boolean | null }) {
  return (
    <aside className="flex min-h-0 flex-col bg-[#fffdf9] p-3">
      <div className="flex items-center gap-2 border-b border-[#eadcca] pb-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#5b351a] text-white"><Bot className="h-3.5 w-3.5" /></span><div><p className="text-[9px] font-black text-[#2d1e11]">Kartografer AI</p><p className="text-[8px] font-semibold text-[#6f8d65]">Ready to suggest</p></div></div>
      <div className="flex-1 space-y-2 overflow-hidden py-3">
        <ChatBubble side="right">Make Day 2 calmer</ChatBubble>
        <ChatBubble side="left">I can move the market walk to evening and keep the gondola before lunch.</ChatBubble>
        <ChatBubble side="right">Keep it under budget</ChatBubble>
        <motion.div
          className="w-fit rounded-2xl rounded-bl-md border border-[#e3d2ba] bg-white px-3 py-2 text-[9px] font-bold text-[#765f49]"
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          transition={{ delay: prefersReducedMotion ? 0 : 2.5, duration: prefersReducedMotion ? 0.2 : 0.3 }}
        >
          Thinking<motion.span animate={prefersReducedMotion ? { opacity: 1 } : { opacity: [1, 0.3, 1] }} transition={prefersReducedMotion ? {} : { duration: 1, repeat: Infinity, ease: "easeInOut" }}>.</motion.span><motion.span animate={prefersReducedMotion ? { opacity: 1 } : { opacity: [1, 0.3, 1] }} transition={prefersReducedMotion ? {} : { duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}>.</motion.span><motion.span animate={prefersReducedMotion ? { opacity: 1 } : { opacity: [1, 0.3, 1] }} transition={prefersReducedMotion ? {} : { duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}>.</motion.span>
        </motion.div>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-[#ddc7a8] bg-white p-2 shadow-sm"><span className="min-w-0 flex-1 truncate text-[8px] font-semibold text-[#9a826a]">Ask Kartografer to adjust this day...</span><button type="button" aria-label="Send message" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#5b351a] text-white"><Send className="h-3 w-3" /></button></div>
    </aside>
  );
}

function ChatBubble({ side, children }: { side: "left" | "right"; children: React.ReactNode }) {
  return <div className={`max-w-[92%] rounded-2xl px-2.5 py-2 text-[8px] font-semibold leading-3.5 ${side === "right" ? "ml-auto rounded-br-md bg-[#5b351a] text-white" : "rounded-bl-md border border-[#e3d2ba] bg-white text-[#65401f]"}`}>{children}</div>;
}

function MiniPreference({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-2 rounded-xl border border-[#eadcca] bg-white px-3 py-2"><span className="text-[#8a5a32]">{icon}</span><div><p className="text-[8px] font-black uppercase text-[#9a7855]">{label}</p><p className="text-[10px] font-black text-[#2d1e11]">{value}</p></div></div>;
}

function PreviewItem({ type, title, icon: Icon, tone }: { type: string; title: string; icon: typeof MapPin; tone: string }) {
  const tones: Record<string, string> = { green: "bg-[#e2eee3] text-[#426948]", red: "bg-[#f2e0db] text-[#994232]", amber: "bg-[#f5e8cf] text-[#8b5c25]", blue: "bg-[#e0eaec] text-[#456b76]" };
  return <div className="flex items-center gap-3 rounded-xl border border-[#eadcca] bg-white p-3"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}><Icon className="h-3.5 w-3.5" /></span><div className="min-w-0"><p className="text-[8px] font-black uppercase text-[#9a7855]">{type}</p><p className="truncate text-[11px] font-black text-[#2d1e11]">{title}</p></div></div>;
}

function EditActivity({ time, title, type }: { time: string; title: string; type: string }) {
  return <div className="rounded-xl border border-[#eadcca] bg-white p-3"><p className="text-[8px] font-black uppercase text-[#9a7855]">{time} · {type}</p><p className="mt-1 text-[10px] font-black text-[#2d1e11]">{title}</p></div>;
}

function MenuAction({ icon, label, danger = false }: { icon: React.ReactNode; label: string; danger?: boolean }) {
  return <div className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[8px] font-black ${danger ? "text-[#a13e30]" : "text-[#65401f]"}`}>{icon}{label}</div>;
}

function OptionCard({ title, meta, prefersReducedMotion }: { title: string; meta: string; prefersReducedMotion: boolean | null }) {
  return (
    <div className="rounded-xl border border-[#e0cdb2] bg-white p-2.5">
      <p className="text-[9px] font-black text-[#2d1e11]">{title}</p>
      <p className="mt-1 text-[8px] font-semibold text-[#907455]">{meta}</p>
      <motion.button
        type="button"
        className="mt-2 w-full rounded-lg bg-[#f2e4d0] py-1.5 text-[8px] font-black text-[#65401f]"
        animate={prefersReducedMotion ? {} : { boxShadow: ["0 0 0 0 rgba(91, 53, 26, 0)", "0 0 0 6px rgba(91, 53, 26, 0)", "0 0 0 0 rgba(91, 53, 26, 0)"] }}
        transition={prefersReducedMotion ? {} : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        + Add to plan
      </motion.button>
    </div>
  );
}