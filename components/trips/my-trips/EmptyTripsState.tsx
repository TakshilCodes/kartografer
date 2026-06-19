import Link from "next/link";
import { ArrowRight, MapPin, Plus } from "lucide-react";

export default function EmptyTripsState() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <div
        className="relative mb-7 h-36 w-full max-w-sm overflow-hidden rounded-lg border border-border bg-card-secondary"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      >
        <div className="absolute left-[18%] top-[68%] w-[62%] -rotate-12 border-t-2 border-dashed border-primary/55" />
        <span className="absolute left-[12%] top-[56%] flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary bg-card text-primary shadow-sm">
          <MapPin className="h-4 w-4" />
        </span>
        <span className="absolute right-[12%] top-[20%] flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
          <MapPin className="h-5 w-5" />
        </span>
        <ArrowRight className="absolute left-[48%] top-[45%] h-5 w-5 -rotate-12 text-primary" />
      </div>

      <h2 className="text-2xl font-black text-foreground">No trips yet</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-secondary-foreground">
        Start by creating your first AI-powered itinerary.
      </p>
      <Link
        href="/dashboard/new"
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-black text-primary-foreground transition hover:bg-primary-hover"
      >
        <Plus className="h-4 w-4" />
        Create new trip
      </Link>
    </div>
  );
}
