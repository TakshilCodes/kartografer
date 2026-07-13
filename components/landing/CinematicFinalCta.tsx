import Link from "next/link";
import { ArrowRight, Compass, MapPin } from "lucide-react";

import styles from "@/components/landing/Landing.module.css";

export default function CinematicFinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-primary py-22 text-primary-foreground sm:py-28">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.55) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,.55) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
        aria-hidden="true"
      />
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 h-52 w-full"
        viewBox="0 0 1440 210"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 180 C260 150 380 65 610 105 S970 200 1190 95 S1340 46 1392 42"
          fill="none"
          stroke="#fff8ed"
          strokeOpacity="0.35"
          strokeWidth="2"
          strokeDasharray="10 10"
        />
        <circle
          cx="1392"
          cy="42"
          r="9"
          fill="#54371d"
          stroke="#fff8ed"
          strokeWidth="3"
        />
        <circle cx="1392" cy="42" r="3" fill="#fff8ed" />
      </svg>
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-white/24 bg-white/10">
          <MapPin className="h-5 w-5" />
        </span>
        <p className="mt-6 text-[10px] font-black uppercase text-primary-foreground/62">
          Route complete · Your plan begins here
        </p>
        <h2
          className={`mt-6 text-[clamp(2.7rem,6vw,5.4rem)] font-black leading-[0.98] ${styles.display}`}
        >
          Give the trip a direction. Keep the final say.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-primary-foreground/72 sm:text-lg">
          Start with the idea you have. Kartografer will help turn it into days
          you can understand, edit, and carry with you.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard/new"
            className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary-foreground px-6 text-sm font-black text-primary shadow-[0_16px_34px_rgba(20,10,4,0.24)] transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Start planning for free{" "}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/explore"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/24 bg-white/8 px-6 text-sm font-black text-primary-foreground transition hover:bg-white/14 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <Compass className="h-4 w-4" /> Explore public trips
          </Link>
        </div>
      </div>
    </section>
  );
}
