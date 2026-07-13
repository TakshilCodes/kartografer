"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  CalendarDays,
  Copy,
  MapPin,
  Route,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import LandingSectionHeading from "@/components/landing/LandingSectionHeading";
import { templates } from "@/components/landing/landing-data";

export default function LandingTemplateGallery() {
  const reducedMotion = useReducedMotion();
  const dragAreaRef = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <section id="templates" className="border-b border-border py-22 sm:py-28">
      <div className="mx-auto w-full max-w-375 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.75fr)] lg:items-end lg:gap-12">
          <LandingSectionHeading
            index="04"
            eyebrow="Routes with a head start"
            title={<>Begin with a trip that already has a shape.</>}
            description="Public itineraries carry real route logic, timing, costs, and day structure. Clone one and edit from there."
          />
          <Link
            href="/explore"
            className="group inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-black text-primary transition hover:border-primary/40 hover:bg-card-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:justify-self-start"
          >
            Browse public trips{" "}
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div
          ref={dragAreaRef}
          className="mt-11 overflow-hidden lg:overflow-visible"
        >
          <motion.div
            drag={mobile && !reducedMotion ? "x" : false}
            dragConstraints={dragAreaRef}
            dragElastic={0.08}
            className="flex w-max cursor-grab gap-4 active:cursor-grabbing lg:grid lg:w-full lg:cursor-default lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.75fr)] lg:grid-rows-[repeat(3,14rem)] lg:gap-x-12 lg:gap-y-4"
          >
            {templates.map((template, index) => (
              <TemplateCard
                key={template.title}
                template={template}
                index={index}
                featured={index === 0}
                reducedMotion={Boolean(reducedMotion)}
              />
            ))}
          </motion.div>
        </div>
        <div className="mt-5 flex items-center justify-between text-[10px] font-black uppercase text-muted-foreground lg:hidden">
          <span>Drag to explore</span>
          <span>01 — 04</span>
        </div>
      </div>
    </section>
  );
}

function TemplateCard({
  template,
  index,
  featured,
  reducedMotion,
}: {
  template: (typeof templates)[number];
  index: number;
  featured: boolean;
  reducedMotion: boolean;
}) {
  return (
    <motion.article
      initial={
        reducedMotion
          ? false
          : {
              opacity: 0,
              y: 24,
              rotate: featured ? -0.5 : index % 2 ? 0.8 : -0.8,
            }
      }
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{
        delay: index * 0.07,
        duration: 0.52,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`group relative flex shrink-0 snap-center overflow-hidden rounded-lg border border-border bg-card shadow-[0_22px_52px_-44px_rgba(55,31,13,0.72)] focus-within:border-primary/50 ${featured ? "h-130 w-[84vw] max-w-155 lg:row-span-3 lg:h-152 lg:w-auto lg:max-w-none lg:self-center" : "h-75 w-[78vw] max-w-90 lg:h-full lg:w-auto lg:max-w-none"}`}
    >
      <Image
        src={template.image}
        alt={`${template.title} public itinerary`}
        fill
        sizes={
          featured
            ? "(max-width: 1024px) 84vw, 60vw"
            : "(max-width: 1024px) 78vw, 30vw"
        }
        className="object-cover transition duration-700 group-hover:scale-[1.045] group-focus-within:scale-[1.045]"
      />
      <div className="absolute inset-0 bg-linear-to-t from-[#241408]/94 via-[#241408]/38 to-[#241408]/12" />
      <svg
        viewBox="0 0 200 70"
        className={`absolute left-5 right-5 ${featured ? "top-20 h-24" : "top-9 h-14"}`}
        aria-hidden="true"
      >
        <motion.path
          d="M8 54 C45 45 48 12 88 25 S135 56 190 12"
          fill="none"
          stroke="#fff8ed"
          strokeWidth={featured ? 2.2 : 2}
          strokeDasharray="6 5"
          style={{ filter: "drop-shadow(0 1px 2px rgba(36, 20, 8, 0.48))" }}
          initial={reducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 + index * 0.08, duration: 0.9 }}
        />
        {[8, 88, 190].map((x, dot) => (
          <motion.circle
            key={x}
            cx={x}
            cy={[54, 25, 12][dot]}
            r={featured ? 4 : 3}
            fill="#fff8ed"
            initial={reducedMotion ? false : { scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ delay: 0.55 + dot * 0.12 }}
          />
        ))}
      </svg>
      <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
        <div className="flex items-center justify-between">
          <span className="rounded-full border border-white/35 bg-black/18 px-2.5 py-1 text-[8px] font-black uppercase backdrop-blur">
            Public itinerary
          </span>
          <span className="text-[9px] font-black uppercase opacity-75">
            Route {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <h3
          className={`mt-4 font-black leading-tight ${featured ? "max-w-xl text-3xl sm:text-4xl" : "text-xl"}`}
        >
          {template.title}
        </h3>
        <p className="mt-2 flex items-center gap-2 text-[10px] font-bold opacity-80">
          <Route className="h-3.5 w-3.5" /> {template.route}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-[9px] font-black">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/14 px-2.5 py-1.5 backdrop-blur">
            <CalendarDays className="h-3 w-3" /> {template.days}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/14 px-2.5 py-1.5 backdrop-blur">
            <Wallet className="h-3 w-3" /> {template.budget}
          </span>
          {featured ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/14 px-2.5 py-1.5 backdrop-blur">
              <MapPin className="h-3 w-3" /> {template.style}
            </span>
          ) : null}
        </div>
        <div className="grid max-h-0 grid-cols-[1fr_auto] items-center gap-3 overflow-hidden opacity-0 transition-all duration-400 group-hover:mt-4 group-hover:max-h-14 group-hover:opacity-100 group-focus-within:mt-4 group-focus-within:max-h-14 group-focus-within:opacity-100">
          <p className="text-[10px] leading-4 opacity-75">
            Clone the full day structure, then keep only what fits your travel
            style.
          </p>
          <Link
            href="/explore"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[10px] font-black text-[#54371d] focus-visible:outline-2 focus-visible:outline-white"
          >
            <Copy className="h-3.5 w-3.5" /> Use plan
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
