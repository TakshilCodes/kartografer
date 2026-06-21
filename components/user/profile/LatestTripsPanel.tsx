import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Plus } from "lucide-react";

export type ProfileLatestTrip = {
  id: string;
  title: string;
  fromPlace: string | null;
  toPlace: string | null;
  daysCount: number;
  updatedAt: string;
};

type LatestTripsPanelProps = {
  trips: ProfileLatestTrip[];
};

export default function LatestTripsPanel({ trips }: LatestTripsPanelProps) {
  return (
    <section className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <p className="text-xs font-black uppercase text-muted-foreground">
            Recent activity
          </p>
          <h2 className="mt-1 text-xl font-black text-foreground">Latest trips</h2>
        </div>
        {trips.length > 0 ? (
          <Link
            href="/dashboard/trips"
            className="shrink-0 text-sm font-black text-primary transition hover:text-primary-hover"
          >
            View all
          </Link>
        ) : null}
      </div>

      {trips.length > 0 ? (
        <div className="divide-y divide-border px-5 sm:px-6">
          {trips.map((trip) => (
            <Link
              key={trip.id}
              href={`/dashboard/trips/${trip.id}`}
              className="group grid gap-3 py-4 transition hover:bg-card-secondary/25 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-foreground group-hover:text-primary-hover">
                  {trip.title}
                </p>
                <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs font-semibold text-secondary-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate">{trip.fromPlace ?? "Starting point"}</span>
                  <ArrowRight className="h-3 w-3 shrink-0" />
                  <span className="truncate">{trip.toPlace ?? "Destination"}</span>
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {trip.daysCount} {trip.daysCount === 1 ? "day" : "days"}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  {new Intl.DateTimeFormat("en-IN", {
                    day: "numeric",
                    month: "short",
                  }).format(new Date(trip.updatedAt))}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="px-5 py-10 text-center sm:px-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-card-secondary text-primary">
            <MapPin className="h-5 w-5" />
          </div>
          <p className="mt-4 text-base font-black text-foreground">
            You have not created any trips yet.
          </p>
          <p className="mt-1 text-sm text-secondary-foreground">
            Your latest journeys will appear here.
          </p>
          <Link
            href="/dashboard/new"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-black text-primary-foreground transition hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4" />
            Create your first trip
          </Link>
        </div>
      )}
    </section>
  );
}