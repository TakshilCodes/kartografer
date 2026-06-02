"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe2 } from "lucide-react";

const navLinks = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Explore",
    href: "/explore",
  },
];

export default function NavbarLinks() {
  const pathname = usePathname();

  return (
    <div className="absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 items-center rounded-full border border-white/40 bg-white/25 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_10px_35px_rgba(93,62,29,0.08)] backdrop-blur-2xl md:flex">
      {navLinks.map((link) => {
        const isActive =
          link.href === "/"
            ? pathname === "/"
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`group relative overflow-hidden rounded-full px-5 py-2.5 text-sm font-bold transition duration-300 ${
              isActive
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {/* Active background */}
            {isActive && (
              <span className="absolute inset-0 rounded-full bg-primary shadow-[0_10px_30px_rgba(93,62,29,0.22)]" />
            )}

            {/* Hover background */}
            {!isActive && (
              <span className="absolute inset-0 scale-75 rounded-full bg-card/70 opacity-0 transition duration-300 group-hover:scale-100 group-hover:opacity-100" />
            )}

            <span className="relative z-10">{link.label}</span>
          </Link>
        );
      })}
    </div>
  );
}