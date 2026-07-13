"use client";

import Link from "next/link";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Explore", href: "/explore" },
] as const;

export default function NavbarLinks() {
  return (
    <div className="hidden items-center gap-1 md:flex">
      {navLinks.map((link) => (
        <Link key={link.href} href={link.href} className="rounded-full px-4 py-2 text-sm font-black text-secondary-foreground transition hover:bg-card-secondary hover:text-primary">
          {link.label}
        </Link>
      ))}
    </div>
  );
}
