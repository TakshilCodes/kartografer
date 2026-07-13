"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useRef } from "react";

import HeroSplineScene from "@/components/landing/HeroSplineScene";
import styles from "@/components/landing/Landing.module.css";
import { tripConstraints } from "@/components/landing/landing-data";

export default function CinematicLandingHero() {
  const heroRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  const reveal = (delay: number, distance = 14) => ({
    initial: reducedMotion ? false : { opacity: 0, y: distance },
    animate: { opacity: 1, y: 0 },
    transition: {
      delay,
      duration: 0.58,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  });

  return (
    <section
      ref={heroRef}
      className={`relative overflow-hidden border-b border-border pt-25 sm:pt-20 ${styles.mapGrid}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 opacity-40 ${styles.contour}`}
        aria-hidden="true"
      />

      <div className="relative mx-auto grid min-h-175 w-full max-w-370 gap-8 px-4 pb-16 sm:px-6 lg:min-h-[calc(100svh-1rem)] lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-8 lg:px-8 xl:gap-12">
        <div className="relative z-10 flex w-full max-w-172.5 flex-col justify-center">
          <motion.div
            {...reveal(0, 12)}
            className="inline-flex w-fit items-center gap-3 rounded-full border border-primary/20 bg-background/80 px-3 py-2 text-sm font-semibold text-primary shadow-sm backdrop-blur-sm "
          >
            <span className="rounded-full bg-foreground px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-background">
              New
            </span>

            <span className="pr-2">AI trip workspace</span>
          </motion.div>

          <motion.h1
            {...reveal(0.08, 18)}
            className={`mt-8 max-w-170 text-balance text-[clamp(3.25rem,8vw,4.4rem)] font-extrabold leading-[0.98] tracking-[-0.055em] text-foreground lg:text-[clamp(3.8rem,4.25vw,4.9rem)] ${styles.display}`}
          >
            Turn a rough travel idea into a trip you can shape.
          </motion.h1>

          <motion.p
            {...reveal(0.16, 14)}
            className="mt-7 max-w-155 text-[1rem] font-medium leading-7 text-foreground/65 sm:text-[1.08rem] sm:leading-8"
          >
            Kartografer drafts the days, routes, stays, transport, meals,
            activities, and costs into one editable itinerary—then leaves every
            decision with you.
          </motion.p>

          <motion.div
            {...reveal(0.24, 12)}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Link
              href="/dashboard/new"
              className=" inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5 "
            >
              Start planning
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/explore"
              className=" inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary/25 bg-background/70 px-7 text-sm font-semibold text-foreground transition-colors hover:bg-primary/5 "
            >
              Explore itineraries
            </Link>
          </motion.div>

          <motion.div
            {...reveal(0.3, 10)}
            className="mt-7 flex flex-wrap gap-2.5"
          >
            {["Editable days", "Live budget", "Suggestions stay optional"].map(
              (item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/55 px-4 py-2 text-xs font-medium text-foreground/65 "
                >
                  <Check className="h-3.5 w-3.5 text-primary" />
                  {item}
                </span>
              ),
            )}
          </motion.div>
        </div>

        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: 0.08,
            duration: 0.85,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative flex min-h-87.5 items-center justify-center sm:min-h-110 lg:min-h-130"
        >
          <div className={styles.heroCanvas}>
            <HeroSplineScene reducedMotion={Boolean(reducedMotion)} />
          </div>
        </motion.div>
      </div>

      <div
        className={`relative overflow-hidden border-t border-border bg-card/72 ${styles.tripMarquee}`}
        aria-label="Trip summary"
      >
        <div className={styles.tripMarqueeTrack}>
          {[0, 1].map((copyIndex) => (
            <div
              key={copyIndex}
              className={styles.tripMarqueeGroup}
              aria-hidden={copyIndex === 1}
            >
              {tripConstraints.map((item) => (
                <div
                  key={`${copyIndex}-${item.label}`}
                  className={`${styles.tripMarqueeItem} border-r border-border bg-card px-5 py-4 sm:px-6`}
                >
                  <p className="text-[9px] font-black uppercase tracking-wider text-secondary-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xs font-black text-foreground">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
