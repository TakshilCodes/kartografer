import type { ReactNode } from "react";
import {
  BedDouble,
  Edit3,
  Hotel,
  MapPin,
  MoreHorizontal,
  Plane,
  Plus,
  Route,
  Sparkles,
  Utensils,
} from "lucide-react";

type TripDay = {
  id: string;
  dayNumber: number;
};

type ItineraryEditorProps = {
  tripId: string;
  days: TripDay[];
  selectedDay: TripDay | undefined;
  selectedDayId: string;
  onSelectDay: (dayId: string) => void;
};

const demoDayPlan = {
  title: "Ahmedabad to Srinagar Arrival",
  description:
    "Arrival day focused on reaching Srinagar, settling into the stay, and enjoying a relaxed evening near Dal Lake.",
  transport: [
    {
      icon: Plane,
      title: "Flight: Ahmedabad → Delhi → Srinagar",
      description: "Suggested arrival route with one stop via Delhi.",
      price: "₹11,000",
    },
    {
      icon: Route,
      title: "Airport pickup to Dal Lake",
      description: "Private cab from Srinagar Airport to houseboat area.",
      price: "₹1,200",
    },
  ],
  stay: {
    title: "Houseboat near Dal Lake",
    description: "Scenic family-friendly houseboat stay near the main lake area.",
    price: "₹5,500/night",
  },
  meals: [
    {
      type: "Lunch",
      title: "Local restaurant near Dal Lake",
      price: "₹900",
    },
    {
      type: "Dinner",
      title: "Vegetarian Kashmiri thali",
      price: "₹1,200",
    },
  ],
  activities: [
    {
      title: "Shikara Ride",
      description: "Relaxed boat ride on Dal Lake during golden hour.",
      price: "₹1,200",
    },
    {
      title: "Walk near Boulevard Road",
      description: "Easy evening walk near the lakeside market area.",
      price: "Free",
    },
  ],
  places: ["Dal Lake", "Boulevard Road", "Srinagar Airport"],
  hiddenSpots: ["Quiet Dal Lake viewpoint", "Local kahwa stop"],
  notes:
    "Keep this day light because it includes travel. Avoid adding too many activities after arrival.",
  cost: "₹18,500",
};

function Surface({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-[26px] border border-border bg-card shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

function SectionTitle({
  icon,
  title,
  action,
}: {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card-secondary text-primary">
          {icon}
        </span>
        <h3 className="text-sm font-black text-foreground">{title}</h3>
      </div>

      {action}
    </div>
  );
}

function SmallActionButton({ children }: { children: ReactNode }) {
  return (
    <button className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-black text-foreground transition hover:bg-card-secondary">
      {children}
    </button>
  );
}

function ItemCard({
  icon,
  title,
  description,
  price,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  price?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-dashboard px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card text-primary">
            {icon}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-black text-foreground">{title}</p>
            <p className="mt-1 text-xs leading-5 text-secondary-foreground">
              {description}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {price ? (
            <span className="rounded-full bg-card-secondary px-2.5 py-1 text-[11px] font-black text-primary">
              {price}
            </span>
          ) : null}

          <button className="text-secondary-foreground transition hover:text-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ItineraryEditor({
  days,
  selectedDay,
  selectedDayId,
  onSelectDay,
}: ItineraryEditorProps) {
  return (
    <>
      <Surface className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-foreground">Select day</h2>
            <p className="text-xs font-semibold text-secondary-foreground">
              Choose which day you want to edit
            </p>
          </div>

          <SmallActionButton>
            <Plus className="h-3.5 w-3.5" />
            Add day
          </SmallActionButton>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden">
          {days.map((day, index) => {
            const isActive = day.id === selectedDayId;

            return (
              <button
                key={day.id}
                onClick={() => onSelectDay(day.id)}
                className={`min-w-45 rounded-2xl border px-4 py-3 text-left transition ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/15"
                    : "border-border bg-dashboard text-foreground hover:bg-card-secondary"
                }`}
              >
                <p className="text-sm font-black">Day {day.dayNumber}</p>
                <p
                  className={`mt-0.5 text-xs font-semibold ${
                    isActive
                      ? "text-primary-foreground/80"
                      : "text-secondary-foreground"
                  }`}
                >
                  {index === 0
                    ? "Arrival & local plan"
                    : index === days.length - 1
                      ? "Checkout / return"
                      : "Sightseeing day"}
                </p>
              </button>
            );
          })}
        </div>
      </Surface>

      <Surface className="overflow-hidden">
        <div className="border-b border-border bg-card-secondary/50 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-secondary-foreground">
                Final itinerary panel
              </p>

              <h2 className="mt-1 text-2xl font-black text-foreground">
                Day {selectedDay?.dayNumber ?? 1} — {demoDayPlan.title}
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary-foreground">
                {demoDayPlan.description}
              </p>
            </div>

            <button className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-black text-foreground transition hover:bg-card-secondary">
              <Edit3 className="h-4 w-4" />
              Edit day info
            </button>
          </div>
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          <section>
            <SectionTitle
              icon={<Route className="h-4 w-4" />}
              title="Selected transport"
              action={
                <SmallActionButton>
                  <Plus className="h-3.5 w-3.5" />
                  Add transport
                </SmallActionButton>
              }
            />

            <div className="space-y-2">
              {demoDayPlan.transport.map((transport) => {
                const Icon = transport.icon;

                return (
                  <ItemCard
                    key={transport.title}
                    icon={<Icon className="h-4 w-4" />}
                    title={transport.title}
                    description={transport.description}
                    price={transport.price}
                  />
                );
              })}
            </div>
          </section>

          <section>
            <SectionTitle
              icon={<Hotel className="h-4 w-4" />}
              title="Selected stay"
              action={
                <SmallActionButton>
                  <Plus className="h-3.5 w-3.5" />
                  Change stay
                </SmallActionButton>
              }
            />

            <ItemCard
              icon={<BedDouble className="h-4 w-4" />}
              title={demoDayPlan.stay.title}
              description={demoDayPlan.stay.description}
              price={demoDayPlan.stay.price}
            />
          </section>

          <section>
            <SectionTitle
              icon={<Utensils className="h-4 w-4" />}
              title="Meals"
              action={
                <SmallActionButton>
                  <Plus className="h-3.5 w-3.5" />
                  Add meal
                </SmallActionButton>
              }
            />

            <div className="grid gap-2 md:grid-cols-2">
              {demoDayPlan.meals.map((meal) => (
                <div
                  key={meal.type}
                  className="rounded-2xl border border-border bg-dashboard px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-secondary-foreground">
                        {meal.type}
                      </p>
                      <p className="mt-1 text-sm font-black text-foreground">
                        {meal.title}
                      </p>
                    </div>

                    <p className="text-xs font-black text-primary">
                      {meal.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionTitle
              icon={<Sparkles className="h-4 w-4" />}
              title="Activities"
              action={
                <SmallActionButton>
                  <Plus className="h-3.5 w-3.5" />
                  Add activity
                </SmallActionButton>
              }
            />

            <div className="space-y-2">
              {demoDayPlan.activities.map((activity) => (
                <ItemCard
                  key={activity.title}
                  icon={<Sparkles className="h-4 w-4" />}
                  title={activity.title}
                  description={activity.description}
                  price={activity.price}
                />
              ))}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div>
              <SectionTitle
                icon={<MapPin className="h-4 w-4" />}
                title="Places covered"
                action={
                  <SmallActionButton>
                    <Plus className="h-3.5 w-3.5" />
                    Add place
                  </SmallActionButton>
                }
              />

              <div className="flex flex-wrap gap-2">
                {demoDayPlan.places.map((place) => (
                  <span
                    key={place}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-dashboard px-3 py-1.5 text-xs font-black text-secondary-foreground"
                  >
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {place}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <SectionTitle
                icon={<MapPin className="h-4 w-4" />}
                title="Custom hidden spots"
                action={
                  <SmallActionButton>
                    <Plus className="h-3.5 w-3.5" />
                    Add hidden spot
                  </SmallActionButton>
                }
              />

              <div className="flex flex-wrap gap-2">
                {demoDayPlan.hiddenSpots.map((spot) => (
                  <span
                    key={spot}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-selected/60 px-3 py-1.5 text-xs font-black text-selected-foreground"
                  >
                    {spot}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="rounded-2xl border border-border bg-dashboard p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-black text-foreground">
                  Day notes
                </h3>

                <button className="text-secondary-foreground transition hover:text-foreground">
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>

              <p className="text-sm leading-6 text-secondary-foreground">
                {demoDayPlan.notes}
              </p>
            </div>

            <div className="rounded-2xl bg-primary p-4 text-primary-foreground">
              <p className="text-xs font-bold opacity-80">
                Day estimated cost
              </p>
              <p className="mt-1 text-2xl font-black">{demoDayPlan.cost}</p>
            </div>
          </section>
        </div>
      </Surface>
    </>
  );
}