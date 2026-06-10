"use client";

import { useMemo, useState } from "react";

import EditTripHeader from "@/components/trips/edit/EditTripHeader";
import OptionsPanel, {
  OptionsPanelContent,
} from "@/components/trips/edit/OptionsPanel";
import ItineraryEditor from "@/components/trips/edit/ItineraryEditor";
import CostEstimator from "@/components/trips/edit/CostEstimator";
import AiAssistantPanel, {
  AiChatContent,
} from "@/components/trips/edit/AiAssistantPanel";
import MobileEditorFooter from "@/components/trips/edit/MobileEditorFooter";
import MobilePanelDrawer from "@/components/trips/edit/MobilePanelDrawer";

type TripDay = {
  id: string;
  dayNumber: number;
  title: string;
  description: string | null;
  notes: string | null;
  estimatedCost: string | null;
};

type TransportOption = {
  id: string;
  tripDayId: string | null;
  title: string;
  mode: string;
  fromText: string | null;
  toText: string | null;
  description: string | null;
  costType: string;
  pricePerPerson: string | null;
  totalCost: string | null;
  isSelected: boolean;
  notes: string | null;
};

type StayOption = {
  id: string;
  tripDayId: string | null;
  name: string;
  city: string | null;
  area: string | null;
  stayType: string;
  budgetLevel: string;
  pricePerNight: string | null;
  nights: number | null;
  totalCost: string | null;
  isSelected: boolean;
  bestFor: string | null;
  notes: string | null;
};

type MealSuggestion = {
  id: string;
  tripDayId: string;
  mealType: string;
  title: string;
  locationName: string | null;
  estimatedCost: string | null;
  isSelected: boolean;
  notes: string | null;
};

type TripActivity = {
  id: string;
  tripDayId: string;
  title: string;
  description: string | null;
  locationName: string | null;
  address: string | null;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  category: string;
  estimatedCost: string | null;
  isSelected: boolean;
  notes: string | null;
  position: number;
};

type CostBreakdown = {
  transportCost: string;
  stayCost: string;
  foodCost: string;
  activityCost: string;
  miscCost: string;
  totalEstimatedCost: string;
  userBudget: string | null;
  budgetStatus: string;
};

type EditTripClientProps = {
  trip: {
    id: string;
    title: string;
    summary: string | null;
    daysCount: number;
    peopleCount: number;
    budgetAmount: string | null;
    costBreakdown: CostBreakdown | null;
    currency: string;
    tripType: string;
    travelPace: string;
    foodPreference: string;
    transportPreference: string;
    fromPlace: {
      name: string;
      formattedName: string;
    } | null;
    toPlace: {
      name: string;
      formattedName: string;
    } | null;
    days: TripDay[];
    transportOptions: TransportOption[];
    stayOptions: StayOption[];
    mealSuggestions: MealSuggestion[];
    activities: TripActivity[];
  };
};

export default function EditTripClient({ trip }: EditTripClientProps) {
  const [selectedDayId, setSelectedDayId] = useState(trip.days[0]?.id ?? "");
  const [mobilePanel, setMobilePanel] = useState<"options" | "ai" | null>(
    null
  );

  const selectedDay = useMemo(() => {
    return trip.days.find((day) => day.id === selectedDayId) ?? trip.days[0];
  }, [selectedDayId, trip.days]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-dashboard pb-24 xl:pb-0">
      <EditTripHeader trip={trip} />

      <div className="mx-auto grid max-w-400 gap-4 p-4 sm:p-5 lg:p-6 xl:h-[calc(100vh-92px)] xl:grid-cols-[300px_minmax(0,1fr)_330px] xl:overflow-hidden">
        <aside className="hidden min-h-0 min-w-0 xl:block xl:h-full xl:overflow-hidden">
          <OptionsPanel
            tripId={trip.id}
            days={trip.days}
            transportOptions={trip.transportOptions}
            stayOptions={trip.stayOptions}
            mealSuggestions={trip.mealSuggestions}
            activities={trip.activities}
          />
        </aside>

        <main className="min-h-0 min-w-0 space-y-4 xl:h-full xl:overflow-y-auto xl:pr-1 scrollbar-none [&::-webkit-scrollbar]:hidden">
          <CostEstimator
            costBreakdown={trip.costBreakdown}
            userBudget={trip.budgetAmount}
            daysCount={trip.daysCount}
            peopleCount={trip.peopleCount}
          />

          <ItineraryEditor
            tripId={trip.id}
            days={trip.days}
            transportOptions={trip.transportOptions}
            stayOptions={trip.stayOptions}
            mealSuggestions={trip.mealSuggestions}
            activities={trip.activities}
            selectedDay={selectedDay}
            selectedDayId={selectedDayId}
            onSelectDay={setSelectedDayId}
          />
        </main>

        <aside className="hidden min-h-0 min-w-0 xl:block xl:h-full xl:overflow-hidden">
          <AiAssistantPanel />
        </aside>
      </div>

      {mobilePanel === "options" ? (
        <MobilePanelDrawer
          title="Options Panel"
          description="Suggestions to add into your final plan"
          onClose={() => setMobilePanel(null)}
        >
          <OptionsPanelContent
            tripId={trip.id}
            days={trip.days}
            transportOptions={trip.transportOptions}
            stayOptions={trip.stayOptions}
            mealSuggestions={trip.mealSuggestions}
            activities={trip.activities}
          />
        </MobilePanelDrawer>
      ) : null}

      {mobilePanel === "ai" ? (
        <MobilePanelDrawer
          title="AI Assistant"
          description="Ask AI to improve your itinerary"
          onClose={() => setMobilePanel(null)}
        >
          <div className="flex h-[70vh] flex-col overflow-hidden rounded-2xl border border-border bg-card">
            <AiChatContent />
          </div>
        </MobilePanelDrawer>
      ) : null}

      <MobileEditorFooter
        activePanel={mobilePanel}
        onOpenOptions={() => setMobilePanel("options")}
        onShowPlan={() => setMobilePanel(null)}
        onOpenAi={() => setMobilePanel("ai")}
      />
    </div>
  );
}
