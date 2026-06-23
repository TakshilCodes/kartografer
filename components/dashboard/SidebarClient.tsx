"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  Edit3,
  FolderOpen,
  Menu,
  Plus,
  Settings,
  Trash2,
  Type,
  User,
  X,
} from "lucide-react";

import { deleteTripAction, renameTripAction } from "@/actions/trips/trip.action";
import ItemActionsMenu from "@/components/trips/edit/ItemActionsMenu";
import LogoutButton from "@/components/shared/LogoutButton";
import BrandLogo from "@/components/shared/BrandLogo";
import { useConfirmStore } from "@/stores/use-confirm-store";

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
  icon: ReactNode;
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
      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition ${active
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
  const router = useRouter();
  const confirm = useConfirmStore((state) => state.confirm);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [renamingTrip, setRenamingTrip] = useState<RecentTrip | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [renameError, setRenameError] = useState("");
  const [actionError, setActionError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!actionError) return;

    const clearTimer = window.setTimeout(() => {
      setActionError("");
    }, 5000);

    return () => window.clearTimeout(clearTimer);
  }, [actionError]);

  function closeMobileSidebar() {
    setIsMobileSidebarOpen(false);
  }

  function openRenameModal(trip: RecentTrip) {
    setActionError("");
    setRenameError("");
    setRenameTitle(trip.title);
    setRenamingTrip(trip);
  }

  function closeRenameModal() {
    setRenamingTrip(null);
    setRenameTitle("");
    setRenameError("");
  }

  function handleEditTrip(trip: RecentTrip) {
    closeMobileSidebar();
    router.push(`/dashboard/trips/${trip.id}/edit`);
  }

  function handleRenameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!renamingTrip) return;

    setRenameError("");

    startTransition(async () => {
      const result = await renameTripAction({
        tripId: renamingTrip.id,
        title: renameTitle,
      });

      if (!result.success) {
        setRenameError(result.message);
        return;
      }

      closeRenameModal();
      router.refresh();
    });
  }

  async function handleDeleteTrip(trip: RecentTrip) {
    const confirmed = await confirm({
      title: "Delete trip?",
      description:
        "This will permanently delete the trip, its days, itinerary items, and budget data. This action cannot be undone.",
      confirmText: "Delete trip",
      cancelText: "Keep trip",
      variant: "danger",
    });

    if (!confirmed) return false;

    setActionError("");

    const result = await deleteTripAction({
      tripId: trip.id,
    });

    if (!result.success) {
      setActionError(result.message);
      return false;
    }

    closeMobileSidebar();

    const tripHref = `/dashboard/trips/${trip.id}`;

    if (pathname === tripHref || pathname.startsWith(`${tripHref}/`)) {
      router.push("/dashboard/new");
    }

    router.refresh();

    return true;
  }

  return (
    <>
      <header className="fixed left-0 top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-dashboard/95 px-4 backdrop-blur lg:hidden">

        <Link href="/dashboard/new" onClick={closeMobileSidebar} aria-label="Kartografer home">
          <BrandLogo themeAware priority compactClassName="h-9 w-9" wordmarkClassName="h-8 w-auto" />
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
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 shrink-0 flex-col border-r border-border bg-dashboard p-4 transition-transform duration-300 lg:z-40 lg:translate-x-0 ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <Link href="/dashboard/new" onClick={closeMobileSidebar} aria-label="Kartografer home">
          <BrandLogo themeAware priority compactClassName="h-10 w-10" wordmarkClassName="h-auto w-44" />
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
            {actionError ? (
              <div className="rounded-2xl border border-danger/20 bg-danger/10 px-3 py-2 text-xs font-bold text-danger">
                {actionError}
              </div>
            ) : null}

            {recentTrips.length > 0 ? (
              recentTrips.map((trip) => {
                const href = `/dashboard/trips/${trip.id}`;
                const active =
                  pathname === href || pathname.startsWith(`${href}/`);

                return (
                  <div
                    key={trip.id}
                    className={`flex items-center gap-2 rounded-2xl py-1.5 pl-3 pr-1.5 text-sm font-bold transition ${active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-secondary-foreground hover:bg-card-hover hover:text-foreground"
                      }`}
                  >
                    <Link
                      href={href}
                      onClick={closeMobileSidebar}
                      className="flex min-w-0 flex-1 items-center gap-3 py-1"
                    >
                      <FolderOpen className="h-4 w-4 shrink-0" />
                      <span className="truncate">{trip.title}</span>
                    </Link>

                    <ItemActionsMenu
                      label={`Open actions for ${trip.title}`}
                      actions={[
                        {
                          label: "Edit",
                          icon: <Edit3 className="h-3.5 w-3.5" />,
                          onClick: () => handleEditTrip(trip),
                        },
                        {
                          label: "Rename",
                          icon: <Type className="h-3.5 w-3.5" />,
                          onClick: () => openRenameModal(trip),
                        },
                        {
                          label: "Delete",
                          icon: <Trash2 className="h-3.5 w-3.5" />,
                          variant: "danger",
                          onClick: () => handleDeleteTrip(trip),
                        },
                      ]}
                    />
                  </div>
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

      {renamingTrip ? (
        <div className="fixed inset-0 z-100 flex items-end justify-center bg-foreground/30 p-3 backdrop-blur-sm sm:items-center">
          <button
            type="button"
            onClick={closeRenameModal}
            className="absolute inset-0"
            aria-label="Close rename trip modal"
          />

          <form
            onSubmit={handleRenameSubmit}
            className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-border bg-card-secondary/50 px-5 py-4">
              <div className="min-w-0">
                <h2 className="text-base font-black text-foreground">
                  Rename trip
                </h2>
                <p className="mt-1 text-sm leading-6 text-secondary-foreground">
                  Update how this trip appears in your sidebar and trip pages.
                </p>
              </div>

              <button
                type="button"
                onClick={closeRenameModal}
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:bg-card-secondary"
                aria-label="Close rename trip modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              <label
                htmlFor="renameTripTitle"
                className="mb-2 block text-sm font-black text-foreground"
              >
                Trip name
              </label>

              <input
                id="renameTripTitle"
                value={renameTitle}
                onChange={(event) => setRenameTitle(event.target.value)}
                className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground/70 hover:bg-input-hover focus:border-ring focus:ring-4 focus:ring-ring/20"
                autoFocus
              />

              {renameError ? (
                <div className="mt-3 rounded-2xl border border-danger/20 bg-danger/10 px-3 py-2 text-xs font-bold text-danger">
                  {renameError}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-border p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeRenameModal}
                className="rounded-full cursor-pointer border border-border bg-card px-5 py-2.5 text-sm font-black text-foreground transition hover:bg-card-secondary"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isPending}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Renaming..." : "Rename trip"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
