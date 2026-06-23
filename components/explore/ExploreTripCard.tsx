import Link from "next/link";
import { CalendarDays, Copy, MapPin, Tag, Users } from "lucide-react";

function formatDate(value: string | null) {
  if (!value) return "Not published";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function labelize(value?: string | null) {
  if (!value) return "Flexible";

  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type ExploreTripCardProps = {
  trip: {
    id: string;
    title: string;
    summary: string | null;
    publicTitle: string | null;
    publicDescription: string | null;
    coverImageUrl: string | null;
    destination: string | null;
    durationDays: number | null;
    daysCount: number;
    peopleCount: number;
    budgetStyle: string | null;
    travelStyle: string | null;
    tags: string[];
    copiedCount: number;
    publishedAt: string | null;
    toPlace: { name: string; formattedName: string } | null;
  };
};

export default function ExploreTripCard({ trip }: ExploreTripCardProps) {
  const title = trip.publicTitle || trip.title;
  const destination = trip.destination || trip.toPlace?.name || "Open route";
  const description = trip.publicDescription || trip.summary || "A public itinerary you can use as a starting point.";
  const duration = trip.durationDays || trip.daysCount;

  return (
    <article className="group overflow-hidden rounded-[28px] border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/explore/${trip.id}`} className="block">
        <div className="relative h-44 overflow-hidden border-b border-border bg-card-secondary">
          {trip.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={trip.coverImageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="relative h-full bg-[#f5e8d5]">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(84,55,29,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(84,55,29,0.10)_1px,transparent_1px)] bg-size-[28px_28px]" />
              <div className="absolute left-6 top-8 h-16 w-24 -rotate-6 rounded-xl border border-[#d9bd98] bg-white/55" />
              <div className="absolute bottom-8 right-7 h-20 w-28 rotate-6 rounded-xl border border-[#d9bd98] bg-[#fff7e8]/80" />
              <div className="absolute left-10 top-24 h-px w-52 rotate-[-10deg] border-t-2 border-dashed border-primary/45" />
              <span className="absolute left-8 top-24 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm">
                <MapPin className="h-4 w-4" />
              </span>
              <span className="absolute right-10 top-14 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <MapPin className="h-4 w-4" />
              </span>
            </div>
          )}

          <div className="absolute left-4 top-4 rounded-full bg-card/90 px-3 py-1.5 text-[11px] font-black text-primary shadow-sm backdrop-blur">
            {labelize(trip.travelStyle)}
          </div>
        </div>

        <div className="p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-black text-primary">
            <MapPin className="h-3.5 w-3.5" />
            <span className="line-clamp-1">{destination}</span>
          </div>

          <h2 className="line-clamp-2 text-lg font-black leading-6 tracking-tight text-foreground">
            {title}
          </h2>

          <p className="mt-2 line-clamp-2 text-sm leading-5 text-secondary-foreground">
            {description}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <MiniStat icon={<CalendarDays className="h-3.5 w-3.5" />} label={`${duration} days`} />
            <MiniStat icon={<Users className="h-3.5 w-3.5" />} label={`${trip.peopleCount} people`} />
            <MiniStat icon={<Copy className="h-3.5 w-3.5" />} label={`${trip.copiedCount} used`} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {trip.budgetStyle ? <Chip>{labelize(trip.budgetStyle)}</Chip> : null}
            {trip.tags.slice(0, 3).map((tag) => (
              <Chip key={tag}>#{tag}</Chip>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
            <span className="text-xs font-bold text-secondary-foreground">
              {formatDate(trip.publishedAt)}
            </span>
            <span className="inline-flex cursor-pointer items-center rounded-full bg-primary px-4 py-2 text-xs font-black text-primary-foreground transition group-hover:bg-primary-hover">
              View itinerary
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

function MiniStat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="rounded-2xl bg-card-secondary/60 px-2.5 py-2 text-center text-[11px] font-black text-secondary-foreground">
      <span className="mx-auto mb-1 flex w-fit text-primary">{icon}</span>
      {label}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card-secondary px-2.5 py-1 text-[11px] font-black text-secondary-foreground">
      <Tag className="h-3 w-3 text-primary" />
      {children}
    </span>
  );
}