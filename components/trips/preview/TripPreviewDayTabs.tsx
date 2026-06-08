"use client";

type PreviewDay = {
  id: string;
  dayNumber: number;
  title: string;
};

type TripPreviewDayTabsProps = {
  days: PreviewDay[];
  selectedDayId?: string;
  onSelectDay: (day: PreviewDay) => void;
  disabled?: boolean;
};

function getTabDayLabel(day: PreviewDay) {
  const defaultTitle = `Day ${day.dayNumber}`;

  if (!day.title || day.title.trim() === defaultTitle) {
    return "";
  }

  return day.title.trim();
}

export default function TripPreviewDayTabs({
  days,
  selectedDayId,
  onSelectDay,
  disabled = false,
}: TripPreviewDayTabsProps) {
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden">
      {days.map((day) => {
        const isActive = day.id === selectedDayId;
        const dayLabel = getTabDayLabel(day);

        return (
          <button
            key={day.id}
            type="button"
            onClick={() => onSelectDay(day)}
            disabled={disabled}
            className={`min-w-45 shrink-0 cursor-pointer rounded-2xl border px-4 py-3 text-left transition disabled:cursor-wait disabled:opacity-80 ${
              isActive
                ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/15"
                : "border-border bg-dashboard text-foreground hover:bg-card-secondary"
            }`}
          >
            <p className="text-sm font-black">Day {day.dayNumber}</p>

            <p
              className={`mt-0.5 line-clamp-1 text-xs font-semibold ${
                isActive
                  ? "text-primary-foreground/80"
                  : "text-secondary-foreground"
              }`}
            >
              {dayLabel || "---"}
            </p>
          </button>
        );
      })}
    </div>
  );
}
