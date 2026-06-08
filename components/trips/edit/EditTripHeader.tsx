import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";

type EditTripHeaderProps = {
  trip: {
    id: string;
    title: string;
    daysCount: number;
    peopleCount: number;
    budgetAmount: string | null;
  };
};

function formatCurrency(amount: string | null) {
  if (!amount) return "Not set";

  const value = Number(amount);

  if (Number.isNaN(value)) return "Not set";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function EditTripHeader({ trip }: EditTripHeaderProps) {
  return (
    <div className="border-b border-border bg-card px-4 py-3 sm:px-5 lg:px-6">
      <div className="mx-auto flex max-w-400 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={`/dashboard/trips/${trip.id}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-dashboard text-secondary-foreground transition hover:bg-card-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-secondary-foreground">
              Trip editor
            </p>
            <h1 className="truncate text-xl font-black text-foreground sm:text-2xl">
              {trip.title}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-card-secondary px-3 py-1.5 text-xs font-black text-secondary-foreground">
            {trip.daysCount} days
          </span>

          <span className="rounded-full bg-card-secondary px-3 py-1.5 text-xs font-black text-secondary-foreground">
            {trip.peopleCount} people
          </span>

          <span className="rounded-full bg-card-secondary px-3 py-1.5 text-xs font-black text-secondary-foreground">
            {formatCurrency(trip.budgetAmount)}
          </span>

          <button className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground transition hover:bg-primary-hover">
            <Check className="h-4 w-4" />
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}