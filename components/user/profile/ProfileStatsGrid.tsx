import {
  CalendarRange,
  Clock3,
  FilePenLine,
  Luggage,
  Share2,
  Sparkles,
} from "lucide-react";

type ProfileStatsGridProps = {
  totalTrips: number;
  aiGeneratedTrips: number;
  publicSharedTrips: number;
  draftTrips: number;
  totalDaysPlanned: number;
  lastTripUpdatedAt: string | null;
};

export default function ProfileStatsGrid(props: ProfileStatsGridProps) {
  const lastUpdated = props.lastTripUpdatedAt
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(props.lastTripUpdatedAt))
    : "No trips yet";

  const stats = [
    { label: "Total trips", value: props.totalTrips, icon: Luggage },
    { label: "AI planned", value: props.aiGeneratedTrips, icon: Sparkles },
    { label: "Public links", value: props.publicSharedTrips, icon: Share2 },
    { label: "Draft trips", value: props.draftTrips, icon: FilePenLine },
    { label: "Days planned", value: props.totalDaysPlanned, icon: CalendarRange },
    { label: "Last trip update", value: lastUpdated, icon: Clock3 },
  ];

  return (
    <section>
      <div className="mb-4">
        <p className="text-xs font-black uppercase text-muted-foreground">
          Travel footprint
        </p>
        <h2 className="mt-1 text-xl font-black text-foreground">Your trip stats</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="min-w-0 rounded-lg border border-border bg-card p-4 shadow-sm"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-card-secondary text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <p className="mt-4 break-words text-lg font-black text-foreground sm:text-xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-bold text-secondary-foreground">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}