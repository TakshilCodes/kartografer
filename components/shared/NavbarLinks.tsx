"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Homes", href: "/" },
  { label: "Explore", href: "/explore" }
];

type NavbarLinksProps = {
  isLoggedIn: boolean;
};

export default function NavbarLinks({ isLoggedIn }: NavbarLinksProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border border-[#e2d3bf] bg-white/72 p-1 shadow-sm backdrop-blur-xl md:flex">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full px-4 py-2 text-sm font-extrabold text-[#765f49] transition hover:bg-[#f4e7d4] hover:text-[#4e2d16]"
          >
            {link.label}
          </Link>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="relative z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#dfcdb4] bg-white/80 text-[#5b351a] md:hidden"
        aria-label={isOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-19.5 z-50 rounded-3xl border border-[#dfcdb4] bg-white p-3 shadow-[0_24px_60px_rgba(70,43,20,0.18)] md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="block rounded-2xl px-4 py-3 text-sm font-extrabold text-[#5b351a] transition hover:bg-[#f5e8d5]"
            >
              {link.label}
            </Link>
          ))}

          <div className="mt-2 border-t border-[#ead9c0] pt-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="block rounded-2xl bg-[#5b351a] px-4 py-3 text-center text-sm font-extrabold text-white shadow-[0_14px_34px_rgba(93,62,29,0.22)] transition hover:bg-[#704522]"
              >
                Workspace
              </Link>
            ) : (
              <div className="grid gap-2">
                <Link
                  href="/signin"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-2xl border border-[#dfcdb4] bg-white px-4 py-3 text-center text-sm font-extrabold text-[#5b351a] transition hover:bg-[#f5e8d5]"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-2xl bg-[#5b351a] px-4 py-3 text-center text-sm font-extrabold text-white shadow-[0_14px_34px_rgba(93,62,29,0.22)] transition hover:bg-[#704522]"
                >
                  Start planning
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}