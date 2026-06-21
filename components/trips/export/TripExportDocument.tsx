import type { ReactNode } from "react";
import {
  ArrowRight,
  BedDouble,
  BusFront,
  CircleDollarSign,
  Compass,
  MapPin,
  Sparkles,
  Utensils,
} from "lucide-react";

import type {
  TripExportActivity,
  TripExportData,
  TripExportDay,
  TripExportMeal,
  TripExportStay,
  TripExportTransport,
} from "@/lib/trips/get-trip-export-data";

type TripExportDocumentProps = {
  trip: TripExportData;
};

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatMoney(value: string | null, currency: string) {
  if (value === null) return "Not estimated";

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "Not estimated";

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(numberValue);
  } catch {
    return `${currency} ${Math.round(numberValue).toLocaleString("en-IN")}`;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l-2 border-[#caa46e] pl-3">
      <p className="text-[9px] font-black uppercase text-[#80684e]">{label}</p>
      <p className="mt-1 text-[12px] font-bold text-[#2d1e11]">{value}</p>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5 border-b border-[#dfd1bd] pb-3">
      <p className="text-[9px] font-black uppercase text-[#8b6b45]">{eyebrow}</p>
      <h2 className="mt-1 text-[22px] font-black leading-tight text-[#2d1e11]">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 max-w-2xl text-[10px] leading-5 text-[#715c46]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function ItemGroup({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="pdf-break-inside-avoid grid grid-cols-[94px_minmax(0,1fr)] gap-4 border-t border-[#eadfce] py-3 first:border-t-0">
      <div className="flex items-start gap-2 text-[#65401f]">
        <span className="mt-0.5">{icon}</span>
        <p className="text-[10px] font-black uppercase">{title}</p>
      </div>
      <div className="min-w-0 space-y-3">{children}</div>
    </div>
  );
}

function ItemLine({
  title,
  meta,
  description,
  cost,
}: {
  title: string;
  meta?: string | null;
  description?: string | null;
  cost?: string | null;
}) {
  return (
    <div className="pdf-break-inside-avoid grid grid-cols-[minmax(0,1fr)_auto] gap-3">
      <div className="min-w-0">
        <p className="text-[11px] font-black leading-4 text-[#2d1e11]">{title}</p>
        {meta ? (
          <p className="mt-0.5 text-[9px] font-bold text-[#8b6b45]">{meta}</p>
        ) : null}
        {description ? (
          <p className="mt-1 text-[9px] leading-4 text-[#715c46]">
            {description}
          </p>
        ) : null}
      </div>
      {cost ? (
        <p className="shrink-0 text-[9px] font-black text-[#65401f]">{cost}</p>
      ) : null}
    </div>
  );
}

function TransportLines({
  items,
  currency,
}: {
  items: TripExportTransport[];
  currency: string;
}) {
  return items.map((item) => {
    const route = [item.fromText, item.toText].filter(Boolean).join(" to ");
    const cost =
      item.costType === "PER_PERSON"
        ? `${formatMoney(item.pricePerPerson, currency)} per person`
        : formatMoney(item.totalCost, currency);

    return (
      <ItemLine
        key={item.id}
        title={item.title}
        meta={[formatEnum(item.mode), route].filter(Boolean).join(" | ")}
        description={item.description ?? item.notes}
        cost={cost}
      />
    );
  });
}

function StayLines({
  items,
  currency,
}: {
  items: TripExportStay[];
  currency: string;
}) {
  return items.map((item) => (
    <ItemLine
      key={item.id}
      title={item.name}
      meta={[
        formatEnum(item.stayType),
        item.area ?? item.city,
        item.nights ? `${item.nights} night${item.nights === 1 ? "" : "s"}` : null,
      ]
        .filter(Boolean)
        .join(" | ")}
      description={item.notes ?? (item.bestFor ? `Best for ${item.bestFor}` : null)}
      cost={formatMoney(item.totalCost ?? item.pricePerNight, currency)}
    />
  ));
}

function MealLines({
  items,
  currency,
}: {
  items: TripExportMeal[];
  currency: string;
}) {
  return items.map((item) => (
    <ItemLine
      key={item.id}
      title={item.title}
      meta={[formatEnum(item.mealType), item.locationName]
        .filter(Boolean)
        .join(" | ")}
      description={item.notes}
      cost={formatMoney(item.estimatedCost, currency)}
    />
  ));
}

function ActivityLines({
  items,
  currency,
}: {
  items: TripExportActivity[];
  currency: string;
}) {
  return items.map((item) => {
    const time = [item.startTime, item.endTime].filter(Boolean).join(" - ");
    const location = item.locationName ?? item.address;

    return (
      <ItemLine
        key={item.id}
        title={item.title}
        meta={[formatEnum(item.category), time, location]
          .filter(Boolean)
          .join(" | ")}
        description={item.description ?? item.notes}
        cost={formatMoney(item.estimatedCost, currency)}
      />
    );
  });
}

function DaySection({
  day,
  currency,
  includeTravelerNotes,
}: {
  day: TripExportDay;
  currency: string;
  includeTravelerNotes: boolean;
}) {
  const defaultTitle = `Day ${day.dayNumber}`;
  const displayTitle =
    day.title.trim() && day.title.trim() !== defaultTitle
      ? day.title
      : "Day at a glance";
  const hasDetails =
    day.transports.length > 0 ||
    day.stays.length > 0 ||
    day.meals.length > 0 ||
    day.activities.length > 0;

  return (
    <section className="pdf-day-section border-t-4 border-[#65401f] bg-white py-5">
      <div className="pdf-break-inside-avoid mb-3 flex items-start justify-between gap-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#65401f] text-[12px] font-black text-[#fff8ed]">
            {day.dayNumber}
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase text-[#8b6b45]">
              Day {day.dayNumber}
            </p>
            <h3 className="mt-0.5 text-[17px] font-black leading-5 text-[#2d1e11]">
              {displayTitle}
            </h3>
            {day.description ? (
              <p className="mt-1.5 max-w-2xl text-[9px] leading-4 text-[#715c46]">
                {day.description}
              </p>
            ) : null}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[8px] font-black uppercase text-[#8b6b45]">
            Day estimate
          </p>
          <p className="mt-1 text-[11px] font-black text-[#2d1e11]">
            {formatMoney(day.estimatedCost, currency)}
          </p>
        </div>
      </div>

      {hasDetails ? (
        <div className="ml-13">
          {day.transports.length > 0 ? (
            <ItemGroup icon={<BusFront className="h-4 w-4" />} title="Transport">
              <TransportLines items={day.transports} currency={currency} />
            </ItemGroup>
          ) : null}
          {day.stays.length > 0 ? (
            <ItemGroup icon={<BedDouble className="h-4 w-4" />} title="Stay">
              <StayLines items={day.stays} currency={currency} />
            </ItemGroup>
          ) : null}
          {day.meals.length > 0 ? (
            <ItemGroup icon={<Utensils className="h-4 w-4" />} title="Meals">
              <MealLines items={day.meals} currency={currency} />
            </ItemGroup>
          ) : null}
          {day.activities.length > 0 ? (
            <ItemGroup icon={<Compass className="h-4 w-4" />} title="Activities">
              <ActivityLines items={day.activities} currency={currency} />
            </ItemGroup>
          ) : null}
        </div>
      ) : (
        <p className="ml-13 border-t border-[#eadfce] py-4 text-[10px] italic text-[#80684e]">
          No itinerary details have been added for this day yet.
        </p>
      )}

      {includeTravelerNotes && day.notes ? (
        <div className="pdf-break-inside-avoid ml-13 mt-2 border-l-2 border-[#caa46e] bg-[#fbf6ed] px-3 py-2">
          <p className="text-[8px] font-black uppercase text-[#8b6b45]">Day note</p>
          <p className="mt-1 text-[9px] leading-4 text-[#5c4937]">{day.notes}</p>
        </div>
      ) : null}
    </section>
  );
}

function CostTable({ trip }: TripExportDocumentProps) {
  const costs = trip.costBreakdown;
  const budget = costs?.userBudget ?? trip.budgetAmount;
  const { includeEstimatedBudget, includePlannedBudget } =
    trip.exportPreferences;
  const rows = [
    ["Transport", costs?.transportCost ?? null],
    ["Stay", costs?.stayCost ?? null],
    ["Food", costs?.foodCost ?? null],
    ["Activities", costs?.activityCost ?? null],
    ["Miscellaneous", costs?.miscCost ?? null],
  ] as const;

  return (
    <div
      className={
        "pdf-break-inside-avoid grid gap-5 " +
        (includeEstimatedBudget && includePlannedBudget
          ? "md:grid-cols-[minmax(0,1fr)_220px]"
          : "grid-cols-1")
      }
    >
      {includeEstimatedBudget ? (
        <div className="overflow-hidden rounded-lg border border-[#dfd1bd]">
          <table className="w-full border-collapse text-left">
            <thead className="bg-[#f3e7d3]">
              <tr>
                <th className="px-4 py-2.5 text-[9px] font-black uppercase text-[#65401f]">
                  Category
                </th>
                <th className="px-4 py-2.5 text-right text-[9px] font-black uppercase text-[#65401f]">
                  Estimate
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label} className="border-t border-[#eadfce]">
                  <td className="px-4 py-2 text-[10px] font-semibold text-[#5c4937]">
                    {label}
                  </td>
                  <td className="px-4 py-2 text-right text-[10px] font-black text-[#2d1e11]">
                    {formatMoney(value, trip.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-[#65401f] bg-[#fbf6ed]">
              <tr>
                <td className="px-4 py-3 text-[11px] font-black text-[#2d1e11]">
                  Total estimated cost
                </td>
                <td className="px-4 py-3 text-right text-[13px] font-black text-[#65401f]">
                  {formatMoney(costs?.totalEstimatedCost ?? null, trip.currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : null}

      {includePlannedBudget ? (
        <div className="rounded-lg bg-[#65401f] p-5 text-[#fff8ed]">
          <CircleDollarSign className="h-5 w-5" />
          <p className="mt-5 text-[9px] font-black uppercase text-[#e8cfaa]">
            Planned budget
          </p>
          <p className="mt-1 text-[20px] font-black">
            {formatMoney(budget, trip.currency)}
          </p>
          <p className="mt-4 border-t border-white/20 pt-3 text-[9px] leading-4 text-[#f4e5ce]">
            Status: {formatEnum(costs?.budgetStatus ?? "UNKNOWN")}
          </p>
        </div>
      ) : null}
    </div>
  );
}
export default function TripExportDocument({ trip }: TripExportDocumentProps) {
  const fromName = trip.fromPlace?.name ?? "Starting point";
  const toName = trip.toPlace?.name ?? "Destination";

  return (
    <article className="trip-export-document mx-auto overflow-hidden bg-[#fffdf8] text-[#2d1e11]">
      <section className="trip-export-cover pdf-page-break-after relative flex min-h-[273mm] flex-col overflow-hidden bg-[#fffdf8] p-[14mm]">
        <div className="absolute left-0 top-0 h-full w-[5mm] bg-[#65401f]" />

        <div className="relative flex items-start justify-between gap-5 border-b border-[#d7c5ab] pb-5">
          {trip.exportPreferences.includeKartograferBranding ? (
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#65401f] text-[#fff8ed]">
                <Compass className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[16px] font-black">Kartografer</p>
                <p className="text-[9px] font-bold uppercase text-[#80684e]">
                  Thoughtful journeys, clearly planned
                </p>
              </div>
            </div>
          ) : (
            <span />
          )}
          <div className="text-right">
            <p className="text-[9px] font-black uppercase text-[#8b6b45]">
              Private travel proposal
            </p>
            <p className="mt-1 text-[9px] text-[#715c46]">
              Prepared {formatDate(trip.updatedAt)}
            </p>
          </div>
        </div>

        <div className="relative pt-13">
          <div className="mb-5 flex items-center gap-3 text-[#65401f]">
            <span className="flex h-6 items-center rounded-full border border-[#caa46e] px-3 text-[8px] font-black uppercase">
              Trip itinerary
            </span>
            <span className="h-px flex-1 bg-[#dfd1bd]" />
          </div>
          <h1 className="max-w-[160mm] text-[40px] font-black leading-[1.02] text-[#2d1e11]">
            {trip.title}
          </h1>
          <p className="mt-5 max-w-[140mm] text-[12px] leading-6 text-[#6d5842]">
            {trip.summary ??
              "A considered travel plan designed around your route, preferences, and pace."}
          </p>
        </div>

        <div
          className="relative mt-12 h-[82mm] overflow-hidden rounded-lg border border-[#d7c5ab] bg-[#f8efdf]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(101,64,31,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(101,64,31,0.07) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        >
          <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border border-[#cdb894]/50" />
          <div className="absolute -right-10 -top-18 h-48 w-48 rounded-full border border-[#cdb894]/60" />
          <div className="absolute -bottom-20 -left-12 h-44 w-44 rounded-full border border-[#cdb894]/45" />

          <div className="relative z-10 flex h-full flex-col justify-between p-7">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[8px] font-black uppercase text-[#8b6b45]">
                Journey map
              </p>
              <p className="text-[8px] font-bold text-[#80684e]">
                {trip.daysCount} days / {trip.peopleCount} travelers
              </p>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_100px_minmax(0,1fr)] items-center gap-6">
              <div className="min-w-0">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#65401f] bg-[#fffdf8] text-[#65401f] shadow-sm">
                  <MapPin className="h-4 w-4" />
                </span>
                <p className="text-[9px] font-black uppercase text-[#8b6b45]">From</p>
                <p className="mt-1 wrap-break-word text-[17px] font-black leading-5">
                  {fromName}
                </p>
                <p className="mt-1 text-[8px] leading-4 text-[#715c46]">
                  {trip.fromPlace?.formattedName ?? "Starting location"}
                </p>
              </div>

              <div className="relative h-px border-t-2 border-dashed border-[#a98559]">
                <span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#65401f] text-[#fff8ed] shadow-sm">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>

              <div className="min-w-0 text-right">
                <span className="mb-3 ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#65401f] text-[#fff8ed] shadow-sm">
                  <MapPin className="h-4 w-4" />
                </span>
                <p className="text-[9px] font-black uppercase text-[#8b6b45]">To</p>
                <p className="mt-1 wrap-break-word text-[17px] font-black leading-5">
                  {toName}
                </p>
                <p className="mt-1 text-[8px] leading-4 text-[#715c46]">
                  {trip.toPlace?.formattedName ?? "Destination"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#cdb894]/70 pt-4 text-[8px] font-bold text-[#80684e]">
              <span>{formatEnum(trip.travelPace)} pace</span>
              <span>{formatEnum(trip.transportPreference)} transport</span>
            </div>
          </div>
        </div>

        <div className="relative mt-auto grid grid-cols-3 gap-5 border-t border-[#d7c5ab] pt-5">
          <DetailPill
            label="Duration"
            value={`${trip.daysCount} ${trip.daysCount === 1 ? "day" : "days"}`}
          />
          <DetailPill
            label="Travelers"
            value={`${trip.peopleCount} ${trip.peopleCount === 1 ? "person" : "people"}`}
          />
          <DetailPill label="Travel style" value={formatEnum(trip.tripType)} />
        </div>
      </section>

      <div className="trip-export-content px-[14mm] py-[12mm]">
        <section className="pdf-break-inside-avoid mb-10">
          <SectionHeading
            eyebrow="Proposal overview"
            title="Designed around your travel style"
            description="A concise view of the preferences that shape this itinerary."
          />
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            <DetailPill label="Trip type" value={formatEnum(trip.tripType)} />
            <DetailPill label="Travel pace" value={formatEnum(trip.travelPace)} />
            <DetailPill
              label="Food preference"
              value={formatEnum(trip.foodPreference)}
            />
            <DetailPill
              label="Transport preference"
              value={formatEnum(trip.transportPreference)}
            />
          </div>
          {trip.exportPreferences.includeTravelerNotes && trip.specialNotes ? (
            <div className="mt-6 rounded-lg border border-[#dfd1bd] bg-[#fbf6ed] p-4">
              <p className="text-[9px] font-black uppercase text-[#8b6b45]">
                Traveler notes
              </p>
              <p className="mt-2 whitespace-pre-wrap text-[10px] leading-5 text-[#5c4937]">
                {trip.specialNotes}
              </p>
            </div>
          ) : null}
        </section>

        {trip.exportPreferences.includeEstimatedBudget ||
        trip.exportPreferences.includePlannedBudget ? (
          <section className="mb-10">
            <SectionHeading
              eyebrow="Estimated investment"
              title="Trip cost summary"
              description="A planning estimate based on the selected itinerary. Final prices may change at booking."
            />
            <CostTable trip={trip} />
          </section>
        ) : null}

        <section>
          <SectionHeading
            eyebrow="Day-by-day plan"
            title="Your itinerary"
            description={`${trip.daysCount} days from ${fromName} to ${toName}, organized for quick client review.`}
          />

          {trip.hasItineraryDetails ? (
            <div className="space-y-7">
              {trip.days.map((day) => (
                <DaySection
                  key={day.id}
                  day={day}
                  currency={trip.currency}
                  includeTravelerNotes={
                    trip.exportPreferences.includeTravelerNotes
                  }
                />
              ))}
            </div>
          ) : (
            <div className="pdf-break-inside-avoid rounded-lg border border-dashed border-[#cbb698] bg-[#fbf6ed] px-6 py-10 text-center">
              <Sparkles className="mx-auto h-6 w-6 text-[#8b6b45]" />
              <p className="mt-3 text-[13px] font-black text-[#2d1e11]">
                This trip does not have itinerary details yet.
              </p>
              <p className="mx-auto mt-2 max-w-md text-[10px] leading-5 text-[#715c46]">
                Add selected transport, stays, meals, or activities before sharing
                the final proposal with a traveler.
              </p>
            </div>
          )}
        </section>

        {trip.exportPreferences.includeKartograferBranding ? (
<footer className="pdf-break-inside-avoid mt-10 border-t border-[#d7c5ab] pt-5">
          <div className="flex items-start justify-between gap-8">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-[#65401f]" />
              <p className="text-[10px] font-black text-[#2d1e11]">
                Generated with Kartografer
              </p>
            </div>
            <p className="max-w-md text-right text-[8px] leading-4 text-[#80684e]">
              Prices, availability, travel times, and local conditions are estimates
              and should be verified before making reservations or payments.
            </p>
          </div>
        </footer>
        ) : null}
      </div>
    </article>
  );
}
