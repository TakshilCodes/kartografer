"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";

import EditTripHeader from "@/components/trips/edit/EditTripHeader";
import OptionsPanel, {
  OptionsPanelContent,
} from "@/components/trips/edit/OptionsPanel";
import ItineraryEditor from "@/components/trips/edit/ItineraryEditor";
import CostEstimator from "@/components/trips/edit/CostEstimator";
import AiAssistantPanel, {
  AiChatContent,
  type ChatMessageDto,
} from "@/components/trips/edit/AiAssistantPanel";
import MobileEditorFooter from "@/components/trips/edit/MobileEditorFooter";
import MobilePanelDrawer from "@/components/trips/edit/MobilePanelDrawer";

const AI_PANEL_DEFAULT_WIDTH = 400;
const AI_PANEL_MIN_WIDTH = 340;
const AI_PANEL_MAX_WIDTH = 680;

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
    chatMessages: ChatMessageDto[];
  };
};

export default function EditTripClient({ trip }: EditTripClientProps) {

  const [selectedDayId, setSelectedDayId] = useState(trip.days[0]?.id ?? "");
  const [mobilePanel, setMobilePanel] = useState<"options" | "ai" | null>(null);
  const [isOptionsCollapsed, setIsOptionsCollapsed] = useState(false);
  const [isAiAssistantCollapsed, setIsAiAssistantCollapsed] = useState(false);
  const [aiAssistantWidth, setAiAssistantWidth] = useState(
    AI_PANEL_DEFAULT_WIDTH,
  );
  const [isAiAssistantResizing, setIsAiAssistantResizing] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1536px)");

    function syncOptionsPanel() {
      setIsOptionsCollapsed(mediaQuery.matches);
    }

    syncOptionsPanel();
    mediaQuery.addEventListener("change", syncOptionsPanel);

    return () => {
      mediaQuery.removeEventListener("change", syncOptionsPanel);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1536px)");

    function syncAiAssistantPanel() {
      setIsAiAssistantCollapsed(mediaQuery.matches);
    }

    syncAiAssistantPanel();
    mediaQuery.addEventListener("change", syncAiAssistantPanel);

    return () => {
      mediaQuery.removeEventListener("change", syncAiAssistantPanel);
    };
  }, []);

  const selectedDay = useMemo(() => {
    return trip.days.find((day) => day.id === selectedDayId) ?? trip.days[0];
  }, [selectedDayId, trip.days]);

  const clampedAiAssistantWidth = Math.min(
    Math.max(aiAssistantWidth, AI_PANEL_MIN_WIDTH),
    AI_PANEL_MAX_WIDTH,
  );

  const editorGridStyle = {
    "--options-panel-width": isOptionsCollapsed ? "52px" : "300px",
    "--ai-panel-width": isAiAssistantCollapsed
      ? "52px"
      : `${clampedAiAssistantWidth}px`,
  } as CSSProperties;

  return (
    <div className="min-h-screen overflow-x-hidden bg-dashboard pb-24 xl:pb-0">
      <EditTripHeader trip={trip} />

      <div
        style={editorGridStyle}
        className={`grid w-full max-w-none gap-4 p-4 sm:p-5 lg:p-6 xl:h-[calc(100vh-92px)] xl:grid-cols-[var(--options-panel-width)_minmax(0,1fr)_var(--ai-panel-width)] xl:overflow-hidden ${isAiAssistantResizing
          ? ""
          : "transition-[grid-template-columns] duration-300"
          }`}
      >
        <aside className="hidden min-h-0 min-w-0 xl:block xl:h-full xl:overflow-hidden">
          <OptionsPanel
            tripId={trip.id}
            days={trip.days}
            transportOptions={trip.transportOptions}
            stayOptions={trip.stayOptions}
            mealSuggestions={trip.mealSuggestions}
            activities={trip.activities}
            isCollapsed={isOptionsCollapsed}
            onToggleCollapsed={() =>
              setIsOptionsCollapsed((value) => !value)
            }
          />
        </aside>

        <main className="min-h-0 min-w-0 space-y-4 scrollbar-none xl:h-full xl:overflow-y-auto xl:pr-1 [&::-webkit-scrollbar]:hidden">
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
          <AiAssistantPanel
            tripId={trip.id}
            initialMessages={trip.chatMessages}
            isCollapsed={isAiAssistantCollapsed}
            panelWidth={clampedAiAssistantWidth}
            minPanelWidth={AI_PANEL_MIN_WIDTH}
            maxPanelWidth={AI_PANEL_MAX_WIDTH}
            onPanelWidthChange={setAiAssistantWidth}
            onPanelResizeStateChange={setIsAiAssistantResizing}
            onToggleCollapsed={() =>
              setIsAiAssistantCollapsed((currentValue) => !currentValue)
            }
          />
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
            <AiChatContent
              tripId={trip.id}
              initialMessages={trip.chatMessages}
            />
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