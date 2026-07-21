"use client";

import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import { ArrowRight, Compass, Menu, X } from "lucide-react";
import { useState } from "react";

import BrandLogo from "@/components/shared/BrandLogo";

const links = [
  { label: "Home", href: "/" },
  { label: "How it works", href: "/#planner" },
  { label: "Explore", href: "/explore" },
] as const;

export default function NavbarClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { scrollY } = useScroll();
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (value) => {
    const nextCompact = value > 88;
    setCompact((current) => (current === nextCompact ? current : nextCompact));
  });

  return (
    <motion.header
      layout
      className={`fixed left-0 z-50 w-full px-3 transition-[top] duration-300 sm:px-4 ${compact ? "top-2" : "top-4 sm:top-5"}`}
    >
      <motion.nav
        layout
        transition={{ layout: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } }}
        className={`relative mx-auto flex items-center justify-between border border-border/90 bg-card/86 text-foreground backdrop-blur-xl transition-[height,max-width,box-shadow,padding] duration-300 ${compact ? "h-14 max-w-5xl rounded-[28px] px-3 shadow-[0_10px_30px_rgba(81,49,23,0.10)]" : "h-17 max-w-7xl rounded-[34px] px-4 shadow-[0_16px_42px_rgba(81,49,23,0.12)]"}`}
        aria-label="Primary navigation"
      >
        <Link
          href="/"
          className="relative z-10 flex min-w-0 items-center"
          aria-label="Kartografer home"
        >
          <BrandLogo
            priority
            wordmarkClassName={`h-auto transition-[width] duration-300 ${compact ? "w-32 lg:w-34" : "w-36 lg:w-40"}`}
          />
        </Link>

        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-xs font-black text-secondary-foreground transition hover:bg-card-secondary hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="relative z-10 hidden items-center gap-2 md:flex">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="group inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-4 text-xs font-black text-primary-foreground transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Compass className="h-4 w-4" /> Workspace{" "}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/signin"
                className="rounded-full px-3 py-2 text-xs font-black text-secondary-foreground transition hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="group inline-flex min-h-10 items-center gap-2 rounded-full bg-primary px-4 text-xs font-black text-primary-foreground transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Start planning{" "}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="relative z-20 grid h-10 w-10 place-items-center rounded-full border border-border bg-background text-primary md:hidden"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              className="absolute left-0 right-0 top-[calc(100%+8px)] overflow-hidden rounded-lg border border-border bg-card p-3 shadow-[0_24px_55px_rgba(70,43,20,0.18)] md:hidden"
            >
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-4 py-3 text-sm font-black text-secondary-foreground hover:bg-card-secondary hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 grid gap-2 border-t border-border pt-3">
                {isLoggedIn ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-primary px-4 py-3 text-center text-sm font-black text-primary-foreground"
                  >
                    Workspace
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/signin"
                      onClick={() => setOpen(false)}
                      className="rounded-full border border-border px-4 py-3 text-center text-sm font-black text-primary"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setOpen(false)}
                      className="rounded-full bg-primary px-4 py-3 text-center text-sm font-black text-primary-foreground"
                    >
                      Start planning
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.nav>
    </motion.header>
  );
}
