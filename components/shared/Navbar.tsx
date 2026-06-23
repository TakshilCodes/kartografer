import Link from "next/link";
import {
  ArrowRight,
  Compass,
} from "lucide-react";
import NavbarLinks from "./NavbarLinks";
import BrandLogo from "@/components/shared/BrandLogo";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Navbar() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = Boolean(session?.user.id);

  return (
    <header className="fixed left-0 top-5 z-50 w-full px-4">
      <div className="mx-auto w-full max-w-7xl">
        <nav className="relative flex h-18 items-center justify-between rounded-4xl border border-[#ddc9ad]/90 bg-white/78 px-3 text-[#2d1e11] shadow-[0_18px_55px_rgba(81,49,23,0.13)] backdrop-blur-2xl sm:px-4">
          {/* Glass layers */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-linear-to-b from-white/45 via-white/20 to-white/10" />
            <div className="absolute inset-0 bg-white/15" />
            <div className="absolute left-0 top-0 h-full w-1/3 bg-linear-to-r from-card-secondary/40 to-transparent" />
            <div className="absolute right-0 top-0 h-full w-1/3 bg-linear-to-l from-card-secondary/30 to-transparent" />
            <div className="absolute inset-x-6 top-0 h-px bg-white/70" />
          </div>

          {/* Left: Brand */}
          <Link
            href="/"
            className="group relative z-10 flex min-w-0 items-center gap-3"
          >
            <BrandLogo priority wordmarkClassName="h-auto w-36 lg:w-40" />
          </Link>

          {/* Center: Active Nav Links */}
          <NavbarLinks isLoggedIn={isLoggedIn} />

          {/* Right: Auth Actions */}
          <div className="relative z-10 hidden items-center gap-2 md:flex">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-[0_14px_34px_rgba(93,62,29,0.24)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(93,62,29,0.30)] active:translate-y-0"
              >
                <Compass className="h-4 w-4" />
                <span className="hidden sm:inline">Workspace</span>
                <ArrowRight className="h-4 w-4 transition duration-300 group-hover:translate-x-1" />
              </Link>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="hidden rounded-full border border-white/35 bg-white/15 px-4 py-2.5 text-sm font-bold text-muted-foreground shadow-sm backdrop-blur-xl transition duration-300 hover:bg-white/30 hover:text-foreground sm:inline-flex"
                >
                  Sign In
                </Link>

                <Link
                  href="/signup"
                  className="group inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-[0_14px_34px_rgba(93,62,29,0.24)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(93,62,29,0.30)] active:translate-y-0 sm:px-5"
                >
                  <span className="hidden sm:inline">Start planning</span><span className="sm:hidden">Start</span>
                  <ArrowRight className="h-4 w-4 transition duration-300 group-hover:translate-x-1" />
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}