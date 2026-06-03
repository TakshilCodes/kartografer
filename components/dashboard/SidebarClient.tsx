"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  FolderOpen,
  Map,
  Menu,
  Plus,
  Settings,
  User,
  X,
} from "lucide-react";

import LogoutButton from "@/components/shared/LogoutButton";

type RecentTrip = {
  id: string;
  title: string;
};

type SidebarClientProps = {
  recentTrips: RecentTrip[];
};

function isActive(pathname: string, href: string) {
  if (href === "/dashboard/new") {
    return pathname === "/dashboard/new";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

type SidebarLinkProps = {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
};

function SidebarLink({ href, icon, label, onClick }: SidebarLinkProps) {
  const pathname = usePathname();
  const active = isActive(pathname, href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-secondary-foreground hover:bg-card-hover hover:text-foreground"
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

export default function SidebarClient({ recentTrips }: SidebarClientProps) {
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  function closeMobileSidebar() {
    setIsMobileSidebarOpen(false);
  }

  return (
    <>
      <header className="fixed left-0 top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-dashboard/95 px-4 backdrop-blur lg:hidden">
        <Link
          href="/dashboard/new"
          className="flex items-center gap-3"
          onClick={closeMobileSidebar}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Map className="h-4 w-4" />
          </div>

          <div>
            <h1 className="text-base font-black leading-none text-foreground">
              Kartografer
            </h1>
            <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
              Travel workspace
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl bg-secondary text-secondary-foreground transition hover:bg-secondary-hover"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {isMobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 shrink-0 flex-col border-r border-border bg-dashboard p-4 transition-transform duration-300 lg:z-40 lg:translate-x-0 ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard/new"
            className="flex items-center gap-3"
            onClick={closeMobileSidebar}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Map className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-lg font-black leading-none text-foreground">
                Kartografer
              </h1>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                Travel workspace
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={closeMobileSidebar}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-2xl bg-secondary text-secondary-foreground transition hover:bg-secondary-hover lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="space-y-2">
          <SidebarLink
            href="/dashboard/new"
            icon={<Plus className="h-4 w-4" />}
            label="New Trip"
            onClick={closeMobileSidebar}
          />

          <SidebarLink
            href="/dashboard/explore"
            icon={<Compass className="h-4 w-4" />}
            label="Explore"
            onClick={closeMobileSidebar}
          />
        </nav>

        <div className="mt-7 min-h-0 flex-1">
          <div className="mb-3 flex items-center justify-between px-2">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
              Recent Trips
            </p>
          </div>

          <div className="space-y-1.5">
            {recentTrips.length > 0 ? (
              recentTrips.map((trip) => {
                const href = `/dashboard/trips/${trip.id}`;
                const active =
                  pathname === href || pathname.startsWith(`${href}/`);

                return (
                  <Link
                    key={trip.id}
                    href={href}
                    onClick={closeMobileSidebar}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition ${
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-secondary-foreground hover:bg-card-hover hover:text-foreground"
                    }`}
                  >
                    <FolderOpen className="h-4 w-4 shrink-0" />
                    <span className="truncate">{trip.title}</span>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-2xl bg-card-secondary px-3 py-3 text-xs font-bold text-muted-foreground">
                No trips created yet.
              </div>
            )}
          </div>

          <Link
            href="/dashboard/trips"
            onClick={closeMobileSidebar}
            className="mt-3 flex items-center justify-center rounded-2xl bg-secondary px-3 py-2.5 text-sm font-black text-secondary-foreground transition hover:bg-secondary-hover"
          >
            View All Trips
          </Link>
        </div>

        <div className="mt-auto space-y-2 border-t border-border pt-4">
          <SidebarLink
            href="/dashboard/settings"
            icon={<Settings className="h-4 w-4" />}
            label="Settings"
            onClick={closeMobileSidebar}
          />

          <SidebarLink
            href="/dashboard/profile"
            icon={<User className="h-4 w-4" />}
            label="Profile"
            onClick={closeMobileSidebar}
          />

          <LogoutButton className="w-full" />
        </div>
      </aside>
    </>
  );
}