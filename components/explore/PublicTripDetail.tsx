import type { ReactNode } from "react";
import Link from "next/link";
import {
  BedDouble,
  CalendarDays,
  Car,
  ChefHat,
  ChevronDown,
  Copy,
  IndianRupee,
  MapPin,
  Route,
  Sparkles,
  Tag,
} from "lucide-react";

import CoverImagePreview from "@/components/explore/CoverImagePreview";
import QuickItineraryOverview from "@/components/explore/QuickItineraryOverview";
import UseItineraryButton from "@/components/explore/UseItineraryButton";
import ReadMoreText from "../shared/ReadMoreText";

function formatCurrency(amount: unknown) {
  if (amount === null || amount === undefined || amount === "") return "Not set";

  const value = Number(amount);

  if (Number.isNaN(value)) return "Not set";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function labelize(value?: string | null) {
  if (!value) return "Flexible";

  return value
    .toString()
    .toLowerCase()
    .split(/[_-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: Date | null) {
  if (!value) return "Not published";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

type PublicTripDetailProps = {
  trip: {
    id: string;
    title: string;
    summary: string | null;
    publicTitle: string | null;
    publicDescription: string | null;
    coverImageUrl: string | null;
    destination: string | null;
    durationDays: number | null;
    budgetStyle: string | null;
    travelStyle: string | null;
    tags: string[];
    copiedCount: number;
    publishedAt: Date | null;
    daysCount: number;
    peopleCount: number;
    budgetAmount: unknown;
    fromPlace: { name: string; formattedName: string } | null;
    toPlace: { name: string; formattedName: string } | null;
    costBreakdown: {
      totalEstimatedCost: unknown;
      transportCost: unknown;
      stayCost: unknown;
      foodCost: unknown;
      activityCost: unknown;
      budgetStatus: string;
    } | null;
    days: Array<{
      id: string;
      dayNumber: number;
      title: string;
      description: string | null;
      notes: string | null;
      estimatedCost: unknown;
      transportOptions: Array<{
        id: string;
        title: string;
        mode: string;
        fromText: string | null;
        toText: string | null;
        description: string | null;
        totalCost: unknown;
        pricePerPerson: unknown;
      }>;
      stayOptions: Array<{
        id: string;
        name: string;
        city: string | null;
        area: string | null;
        budgetLevel: string;
        totalCost: unknown;
        pricePerNight: unknown;
        nights: number | null;
      }>;
      mealSuggestions: Array<{
        id: string;
        mealType: string;
        title: string;
        locationName: string | null;
        estimatedCost: unknown;
      }>;
      activities: Array<{
        id: string;
        title: string;
        description: string | null;
        locationName: string | null;
        category: string;
        startTime: string | null;
        endTime: string | null;
        estimatedCost: unknown;
      }>;
    }>;
  };
};

export default function PublicTripDetail({ trip }: PublicTripDetailProps) {
  const title = trip.publicTitle || trip.title;
  const description = trip.publicDescription || trip.summary || "A public itinerary shared by the Kartografer community.";
  const destination = trip.destination || trip.toPlace?.name || "Open destination";
  const duration = trip.durationDays || trip.daysCount;
  const estimatedTotal = formatCurrency(trip.costBreakdown?.totalEstimatedCost);
  const overviewDays = trip.days.map((day) => ({ id: day.id, dayNumber: day.dayNumber, title: day.title }));

  return (
    <div className="min-h-screen bg-background px-3 pt-35 pb-4 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-330 space-y-5">
        <header className="overflow-hidden rounded-4xl border border-border bg-card shadow-sm">
          <div className="relative bg-card-secondary p-5 sm:p-7">
            <div className="absolute inset-0 opacity-45">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(84,55,29,0.075)_1px,transparent_1px),linear-gradient(to_bottom,rgba(84,55,29,0.075)_1px,transparent_1px)] bg-size-[34px_34px]" />
            </div>

            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="min-w-0">
                <Link href="/explore" className="text-xs font-black text-primary transition hover:text-primary-hover">
                  Back to Explore
                </Link>
                <p className="mt-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-secondary-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {destination}
                </p>
                <h1 className="mt-2 max-w-4xl text-3xl font-black leading-tight tracking-tight text-foreground sm:text-5xl">
                  {title}
                </h1>

                <ReadMoreText
                  text={description}
                  lines={3}
                  className="mt-4 max-w-3xl text-sm leading-6 text-secondary-foreground sm:text-base"
                />

                <div className="mt-5 flex flex-wrap gap-2">
                  <MetaPill icon={<CalendarDays className="h-3.5 w-3.5" />} value={`${duration} days`} />
                  <MetaPill icon={<MapPin className="h-3.5 w-3.5" />} value={destination} />
                  <MetaPill icon={<IndianRupee className="h-3.5 w-3.5" />} value={labelize(trip.budgetStyle)} />
                  <MetaPill icon={<Sparkles className="h-3.5 w-3.5" />} value={labelize(trip.travelStyle)} />
                  <MetaPill icon={<Copy className="h-3.5 w-3.5" />} value={`${trip.copiedCount} used`} />
                  {estimatedTotal !== "Not set" ? <MetaPill icon={<IndianRupee className="h-3.5 w-3.5" />} value={`${estimatedTotal} est.`} /> : null}
                </div>

                {trip.tags.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {trip.tags.map((tag) => (
                      <Link key={tag} href={`/explore?tag=${encodeURIComponent(tag)}`} className="inline-flex items-center gap-1 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-black text-secondary-foreground transition hover:bg-card hover:text-foreground">
                        <Tag className="h-3 w-3 text-primary" />
                        {tag}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="space-y-4 lg:sticky lg:top-4 lg:h-fit">
                <CoverImagePreview imageUrl={trip.coverImageUrl} title={title} destination={destination} />
                <section className="rounded-[28px] border border-border bg-card p-4 shadow-sm">
                  <UseItineraryButton publicTripId={trip.id} />

                  <p className="mt-3 text-xs leading-5 text-secondary-foreground">
                    This creates a private copy in your workspace. The original trip stays unchanged.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1 scrollbar-hide">
            <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
              <h2 className="text-sm font-black text-foreground">Trip summary</h2>
              <div className="mt-4 space-y-3 text-sm">
                <SummaryLine label="From" value={trip.fromPlace?.name ?? "Open"} />
                <SummaryLine label="To" value={trip.toPlace?.name ?? destination} />
                <SummaryLine label="Published" value={formatDate(trip.publishedAt)} />
                <SummaryLine label="Estimated" value={estimatedTotal} />
                <SummaryLine label="Planned budget" value={formatCurrency(trip.budgetAmount)} />
                <SummaryLine label="Travelers" value={`${trip.peopleCount} people`} />
              </div>
            </section>

            <QuickItineraryOverview days={overviewDays} />

            {trip.tags.length > 0 ? (
              <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
                <h2 className="text-sm font-black text-foreground">Tags</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {trip.tags.map((tag) => (
                    <Link key={tag} href={`/explore?tag=${encodeURIComponent(tag)}`} className="inline-flex items-center gap-1 rounded-full border border-border bg-card-secondary px-3 py-1.5 text-xs font-black text-secondary-foreground transition hover:bg-secondary hover:text-foreground">
                      <Tag className="h-3 w-3 text-primary" />
                      {tag}
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>

          <div className="space-y-5">
            {trip.days.map((day) => (
              <details
                key={day.id}
                id={`day-${day.dayNumber}`}
                data-day-number={day.dayNumber}
                open
                className="group scroll-mt-32 overflow-hidden rounded-[28px] border border-border bg-card shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 border-b border-border bg-card-secondary/35 px-5 py-4 transition hover:bg-card-secondary/60 [&::-webkit-details-marker]:hidden">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Day {day.dayNumber}</p>
                    <h2 className="mt-1 text-xl font-black text-foreground">{day.title}</h2>
                    {day.description ?
                      <ReadMoreText
                        text={day.description}
                        lines={1}
                        className="mt-1 text-sm leading-6 text-secondary-foreground"
                      /> : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="hidden rounded-full bg-card px-3 py-1.5 text-xs font-black text-primary shadow-sm sm:inline-flex">
                      {formatCurrency(day.estimatedCost)}
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm transition group-open:rotate-180">
                      <ChevronDown className="h-4 w-4" />
                    </span>
                  </div>
                </summary>

                <div className="grid gap-4 p-5 xl:grid-cols-2">
                  <DetailGroup icon={<Route className="h-4 w-4" />} title="Transport">
                    {day.transportOptions.length > 0 ? (
                      day.transportOptions.map((item) => (
                        <DetailRow key={item.id} title={item.title} meta={[labelize(item.mode), item.fromText, item.toText].filter(Boolean).join(" - ")} cost={formatCurrency(item.totalCost || item.pricePerPerson)} />
                      ))
                    ) : (
                      <EmptyLine>No selected transport.</EmptyLine>
                    )}
                  </DetailGroup>

                  <DetailGroup icon={<BedDouble className="h-4 w-4" />} title="Stays">
                    {day.stayOptions.length > 0 ? (
                      day.stayOptions.map((item) => (
                        <DetailRow key={item.id} title={item.name} meta={[item.area, item.city, labelize(item.budgetLevel)].filter(Boolean).join(" - ")} cost={formatCurrency(item.totalCost || item.pricePerNight)} />
                      ))
                    ) : (
                      <EmptyLine>No selected stay.</EmptyLine>
                    )}
                  </DetailGroup>

                  <DetailGroup icon={<ChefHat className="h-4 w-4" />} title="Meals">
                    {day.mealSuggestions.length > 0 ? (
                      day.mealSuggestions.map((item) => (
                        <DetailRow key={item.id} title={item.title} meta={[labelize(item.mealType), item.locationName].filter(Boolean).join(" - ")} cost={formatCurrency(item.estimatedCost)} />
                      ))
                    ) : (
                      <EmptyLine>No selected meals.</EmptyLine>
                    )}
                  </DetailGroup>

                  <DetailGroup icon={<Car className="h-4 w-4" />} title="Activities & hidden spots">
                    {day.activities.length > 0 ? (
                      day.activities.map((item) => (
                        <DetailRow key={item.id} title={item.title} meta={[labelize(item.category), item.locationName, item.startTime].filter(Boolean).join(" - ")} cost={formatCurrency(item.estimatedCost)} />
                      ))
                    ) : (
                      <EmptyLine>No selected activities.</EmptyLine>
                    )}
                  </DetailGroup>
                </div>

                {day.notes ? (
                  <div className="border-t border-border bg-card-secondary/25 px-5 py-4 text-sm leading-6 text-secondary-foreground">
                    <span className="font-black text-foreground">Day note: </span>
                    {day.notes}
                  </div>
                ) : null}
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetaPill({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/85 px-3 py-1.5 text-xs font-black text-foreground shadow-sm">
      <span className="text-primary">{icon}</span>
      {value}
    </span>
  );
}

function DetailGroup({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-dashboard/70 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-foreground">
        <span className="text-primary">{icon}</span>
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function DetailRow({ title, meta, cost }: { title: string; meta: string; cost: string }) {
  return (
    <div className="rounded-2xl bg-card px-3 py-2.5 shadow-sm shadow-black/3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="wrap-break-word text-sm font-black text-foreground">{title}</p>
          {meta ? <p className="mt-0.5 text-xs leading-5 text-secondary-foreground">{meta}</p> : null}
        </div>
        <p className="shrink-0 text-xs font-black text-primary">{cost}</p>
      </div>
    </div>
  );
}

function EmptyLine({ children }: { children: ReactNode }) {
  return <p className="text-sm text-secondary-foreground">{children}</p>;
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-secondary-foreground">{label}</span>
      <span className="text-right font-black text-foreground">{value}</span>
    </div>
  );
}