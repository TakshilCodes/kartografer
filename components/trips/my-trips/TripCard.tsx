import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CircleDot,
  Edit3,
  MapPin,
  Navigation,
  Users,
} from "lucide-react";

export type MyTripCardData = {
  id: string;
  title: string;
  summary: string | null;
  daysCount: number;
  peopleCount: number;
  budgetAmount: string | null;
  currency: string;
  status: "DRAFT" | "GENERATED" | "EDITING" | "COMPLETED" | "ARCHIVED";
  isAiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
  fromPlace: string | null;
  toPlace: string | null;
  totalEstimatedCost: string | null;
  budgetStatus: string | null;
  dayCount: number;
  activityCount: number;
};

type TripCardProps = {
  trip: MyTripCardData;
};

const statusStyles: Record<MyTripCardData["status"], string> = {
  DRAFT: "border-warning/25 bg-warning/10 text-warning",
  GENERATED: "border-success/25 bg-success/10 text-success",
  EDITING: "border-selected bg-selected/30 text-selected-foreground",
  COMPLETED: "border-primary/20 bg-primary/10 text-primary",
  ARCHIVED: "border-border bg-card text-muted-foreground",
};

function formatStatus(status: MyTripCardData["status"]) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatMoney(amount: string | null, currency: string) {
  if (!amount) return null;

  const value = Number(amount);

  if (!Number.isFinite(value)) return null;

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${Math.round(value).toLocaleString("en-IN")}`;
  }
}

function formatUpdatedDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function TripMapPlaceholder({ trip }: TripCardProps) {
  const fromLabel = trip.fromPlace ?? "Start";
  const toLabel = trip.toPlace ?? "Destination";

  return (
    <div
      className="relative h-36 overflow-hidden border-b border-border bg-card-secondary"
      style={{
        backgroundImage:
          "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      <div className="absolute -left-5 top-5 h-16 w-32 -rotate-6 border border-primary/15 bg-card/65" />
      <div className="absolute -right-7 bottom-1 h-20 w-40 rotate-6 border border-primary/15 bg-card/60" />

      <div className="absolute inset-x-5 top-[46%] z-10 h-16">
        <div className="absolute left-4 right-4 top-4 border-t-2 border-dashed border-primary/55" />
        <CircleDot className="absolute left-1/2 top-2 h-4 w-4 -translate-x-1/2 bg-card-secondary text-primary/55" />

        <div className="absolute left-0 top-0 flex w-[43%] flex-col items-start">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-card text-primary shadow-sm">
            <MapPin className="h-4 w-4" />
          </span>
          <span className="mt-1 max-w-full truncate bg-card-secondary/90 px-1 text-[10px] font-black uppercase text-secondary-foreground">
            {fromLabel}
          </span>
        </div>

        <div className="absolute right-0 top-0 flex w-[43%] flex-col items-end">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <MapPin className="h-4 w-4" />
          </span>
          <span className="mt-1 max-w-full truncate bg-card-secondary/90 px-1 text-right text-[10px] font-black uppercase text-secondary-foreground">
            {toLabel}
          </span>
        </div>
      </div>

      <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card/90 text-primary">
        <Navigation className="h-3.5 w-3.5" />
      </span>
    </div>
  );
}

export default function TripCard({ trip }: TripCardProps) {
  const previewHref = `/dashboard/trips/${trip.id}`;
  const editHref = `${previewHref}/edit`;
  const estimatedCost = formatMoney(trip.totalEstimatedCost, trip.currency);
  const plannedBudget = formatMoney(trip.budgetAmount, trip.currency);
  const costText = estimatedCost ?? plannedBudget ?? "Budget not set";
  const costLabel = estimatedCost ? "Estimated cost" : "Planned budget";

  return (
    <article className="group min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md">
      <Link href={previewHref} aria-label={`View ${trip.title}`}>
        <TripMapPlaceholder trip={trip} />
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={previewHref}
              className="line-clamp-2 text-base font-black leading-6 text-foreground transition hover:text-primary-hover"
            >
              {trip.title}
            </Link>
            <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs font-bold text-secondary-foreground">
              <span className="truncate">{trip.fromPlace ?? "Start not set"}</span>
              <ArrowRight className="h-3 w-3 shrink-0" />
              <span className="truncate">{trip.toPlace ?? "Destination not set"}</span>
            </p>
          </div>

          <span
            className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black uppercase ${statusStyles[trip.status]}`}
          >
            {formatStatus(trip.status)}
          </span>
        </div>

        <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
          {trip.summary || "A new journey waiting for its itinerary details."}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 border-y border-border py-3 text-xs font-bold text-secondary-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            {trip.daysCount} {trip.daysCount === 1 ? "day" : "days"}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary" />
            {trip.peopleCount} {trip.peopleCount === 1 ? "traveler" : "travelers"}
          </span>
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase text-muted-foreground">
              {costLabel}
            </p>
            <p className="truncate text-sm font-black text-foreground">{costText}</p>
            <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
              {trip.dayCount} planned days / {trip.activityCount} activities
            </p>
          </div>

          {trip.isAiGenerated ? (
            <span className="shrink-0 rounded-full bg-card-secondary px-2 py-1 text-[10px] font-black text-secondary-foreground">
              AI planned
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold text-muted-foreground">
            Updated {formatUpdatedDate(trip.updatedAt)}
          </p>

          <div className="flex items-center gap-2">
            <Link
              href={editHref}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-black text-foreground transition hover:bg-card-hover"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </Link>
            <Link
              href={previewHref}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-black text-primary-foreground transition hover:bg-primary-hover"
            >
              View
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
