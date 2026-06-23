"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import ShinyText from "@/components/landing/ShinyText";
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

export default function LandingExportPdf() {
    const sectionRef = useRef<HTMLElement | null>(null);

    const [hasStarted, setHasStarted] = useState(false);
    const [activeOption, setActiveOption] = useState(0);
    const [buttonState, setButtonState] = useState<"preparing" | "ready">(
        "preparing",
    );

    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        if (shouldReduceMotion) {
            setHasStarted(true);
            setActiveOption(exportOptions.length);
            setButtonState("ready");
            return;
        }

        const section = sectionRef.current;

        if (!section) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setHasStarted(true);
                    observer.disconnect();
                }
            },
            {
                threshold: 0.35,
            },
        );

        observer.observe(section);

        return () => observer.disconnect();
    }, [shouldReduceMotion]);

    useEffect(() => {
        if (!hasStarted || shouldReduceMotion) return;

        setActiveOption(0);
        setButtonState("preparing");

        const timeouts: number[] = [];

        exportOptions.forEach((_, index) => {
            timeouts.push(
                window.setTimeout(
                    () => {
                        setActiveOption(index + 1);
                    },
                    900 + index * 850,
                ),
            );
        });

        timeouts.push(
            window.setTimeout(
                () => {
                    setButtonState("ready");
                },
                900 + exportOptions.length * 850 + 2600,
            ),
        );

        // Wait after everything is completed, then replay slowly.
        timeouts.push(
            window.setTimeout(
                () => {
                    setHasStarted(false);

                    window.setTimeout(() => {
                        setHasStarted(true);
                    }, 300);
                },
                900 + exportOptions.length * 850 + 6200,
            ),
        );

        return () => {
            timeouts.forEach((timeout) => window.clearTimeout(timeout));
        };
    }, [hasStarted, shouldReduceMotion]);

    const buttonLabel = useMemo(() => {
        if (buttonState === "preparing") return "Preparing PDF...";
        return "PDF Ready";
    }, [buttonState]);

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
                                        key={option}
                                        initial={false}
                                        animate={{
                                            backgroundColor: checked ? "#fff7e8" : "#ffffff",
                                            borderColor: checked ? "#d8bd98" : "#ead9c0",
                                        }}
                                        transition={{ duration: 0.28 }}
                                        className="flex items-center gap-3 rounded-2xl border px-3.5 py-3"
                                    >
                                        <span
                                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition ${checked
                                                ? "bg-[#5b351a] text-white shadow-[0_0_0_5px_rgba(91,53,26,0.08)]"
                                                : "bg-[#f8f1e6] text-[#b0926e]"
                                                }`}
                                        >
                                            {checked ? <Check className="h-3.5 w-3.5" /> : null}
                                        </span>

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
                            whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                            className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#5b351a] px-6 text-sm font-black text-white shadow-[0_18px_45px_rgba(91,53,26,0.22)] transition hover:bg-[#704522]"
                        >
                            {buttonState === "preparing" ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            ) : (
                                <Download className="h-4 w-4" />
                            )}

                            {buttonLabel}
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

                        <div className="relative mx-auto max-w-140 rounded-4xl border border-[#d8c2a4] bg-white p-5 shadow-[0_34px_100px_rgba(91,53,26,0.20)] sm:p-7">

                            <motion.div
                                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                                whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1, duration: 0.5 }}
                                className="flex items-center justify-between gap-4 border-b border-[#ead9c0] pb-5"
                            >
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
                            </motion.div>

                            <motion.div
                                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                                whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.22, duration: 0.5 }}
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
                                        key={row.day}
                                        initial={shouldReduceMotion ? false : { opacity: 0, x: 18 }}
                                        whileInView={
                                            shouldReduceMotion ? undefined : { opacity: 1, x: 0 }
                                        }
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.35 + index * 0.12, duration: 0.5 }}
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
                                whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.75, duration: 0.55 }}
                                className="mt-5 grid gap-2 sm:grid-cols-2"
                            >
                                {pdfItems.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <div
                                            key={item.label}
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
                                        </div>
                                    );
                                })}
                            </motion.div>

                            <motion.div
                                initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
                                whileInView={
                                    shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }
                                }
                                viewport={{ once: true }}
                                transition={{ delay: 0.9, duration: 0.5 }}
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
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[9px] font-black uppercase text-[#e4c399]">{label}</p>
            <p className="mt-1 text-sm font-black text-white">{value}</p>
        </div>
    );
}