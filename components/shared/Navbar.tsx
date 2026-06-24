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