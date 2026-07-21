import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTripChatPrompt,
  TRIP_CHAT_SYSTEM_INSTRUCTION,
} from "@/lib/ai/prompts/trip-chat.prompt";
import {
  buildTripChatContext,
  type TripChatSource,
} from "@/lib/ai/trip-chat/context";

function createTripSource(): TripChatSource {
  return {
    id: "trip-stable-id",
    title: "Grounded Rajasthan Trip",
    summary: "A two-day saved itinerary.",
    daysCount: 2,
    peopleCount: 2,
    budgetAmount: 10_000,
    currency: "INR",
    tripType: "FAMILY",
    travelPace: "BALANCED",
    foodPreference: "VEGETARIAN",
    transportPreference: "CAB",
    specialNotes: "Prefer a comfortable pace.",
    fromPlace: { name: "Ahmedabad", formattedName: "Ahmedabad, Gujarat" },
    toPlace: { name: "Udaipur", formattedName: "Udaipur, Rajasthan" },
    days: [
      {
        id: "day-stable-1",
        dayNumber: 1,
        title: "Arrival",
        description: "Check in and explore nearby.",
        notes: null,
        estimatedCost: 6_000,
      },
      {
        id: "day-stable-2",
        dayNumber: 2,
        title: "City day",
        description: "Saved city itinerary.",
        notes: null,
        estimatedCost: 2_500,
      },
    ],
    transportOptions: [
      {
        id: "transport-selected-id",
        tripDayId: "day-stable-1",
        title: "Private cab",
        mode: "CAB",
        fromText: "Ahmedabad",
        toText: "Udaipur",
        description: "Saved selected transfer.",
        costType: "PER_PERSON",
        pricePerPerson: 1_000,
        totalCost: null,
        isSelected: true,
        notes: null,
      },
      {
        id: "transport-option-id",
        tripDayId: "day-stable-1",
        title: "Bus option",
        mode: "BUS",
        fromText: "Ahmedabad",
        toText: "Udaipur",
        description: "An option only.",
        costType: "TOTAL",
        pricePerPerson: null,
        totalCost: 900,
        isSelected: false,
        notes: "Not in the final plan.",
      },
    ],
    stayOptions: [
      {
        id: "stay-selected-id",
        tripDayId: "day-stable-1",
        name: "Selected Hotel",
        city: "Udaipur",
        area: "Old City",
        stayType: "HOTEL",
        budgetLevel: "MID_RANGE",
        pricePerNight: 3_000,
        nights: 1,
        totalCost: null,
        isSelected: true,
        bestFor: "Location",
        notes: null,
      },
    ],
    mealSuggestions: [
      {
        id: "meal-selected-id",
        tripDayId: "day-stable-1",
        mealType: "DINNER",
        title: "Selected dinner",
        locationName: "Old City",
        estimatedCost: 500,
        isSelected: true,
        notes: null,
      },
    ],
    activities: Array.from({ length: 6 }, (_, index) => ({
      id: `activity-selected-${index + 1}`,
      tripDayId: index < 3 ? "day-stable-1" : "day-stable-2",
      title: `Selected activity ${index + 1}`,
      description: `Saved activity ${index + 1}`,
      locationName: "Udaipur",
      address: null,
      startTime: `${10 + index}:00`,
      endTime: `${11 + index}:00`,
      durationMinutes: 60,
      category: "SIGHTSEEING",
      estimatedCost: 500,
      isSelected: true,
      notes: null,
      position: index,
    })),
  };
}

function createContext() {
  return buildTripChatContext({
    trip: createTripSource(),
    recentConversation: [
      {
        role: "USER",
        content: "Please remember that comfort matters.",
        proposalStatus: "NONE",
        proposalSummary: null,
      },
      {
        role: "ASSISTANT",
        content: "I proposed a saved itinerary adjustment.",
        proposalStatus: "APPLIED",
        proposalSummary: "Updated Day 1 pacing",
      },
    ],
  });
}

test("good-budget improvement request requires Gemini-generated structured actions", () => {
  const message =
    "Can I improve this trip a little because I have a good budget?";


  const prompt = buildTripChatPrompt({
    context: createContext(),
    userMessage: message,
  });
  assert.match(prompt, /PREVIOUS_ASSISTANT_STATE_JSON/);
  assert.match(TRIP_CHAT_SYSTEM_INSTRUCTION, /empty edits array/);
  assert.match(prompt, /remainingBudget/);
  assert.match(TRIP_CHAT_SYSTEM_INSTRUCTION, /PROPOSAL JSON CONTRACT/);
  assert.match(TRIP_CHAT_SYSTEM_INSTRUCTION, /USE_SAVED_OPTION/);
  assert.match(TRIP_CHAT_SYSTEM_INSTRUCTION, /EXTENSION_DAY/);
});

test("budget facts are deterministic and preserve existing cost semantics", () => {
  const { budgetFacts } = createContext();

  assert.equal(budgetFacts.categoryTotals.transport, 2_000);
  assert.equal(budgetFacts.categoryTotals.stays, 3_000);
  assert.equal(budgetFacts.categoryTotals.meals, 500);
  assert.equal(budgetFacts.categoryTotals.activities, 3_000);
  assert.equal(budgetFacts.currentEstimatedSelectedTotal, 8_500);
  assert.equal(budgetFacts.remainingBudget, 1_500);
  assert.equal(budgetFacts.exceededBy, null);
  assert.equal(budgetFacts.percentageUsed, 85);
  assert.equal(budgetFacts.costPerTraveller, 4_250);
  assert.equal(budgetFacts.costPerTripDay, 4_250);
});

test("selected itinerary and unselected options remain separate", () => {
  const context = createContext();
  const selectedTransportIds = context.selectedItinerary.days.flatMap((day) =>
    day.transports.map((item) => item.id),
  );

  assert.deepEqual(selectedTransportIds, ["transport-selected-id"]);
  assert.equal(context.unselectedOptions.transports.totalCount, 1);
  assert.equal(
    context.unselectedOptions.transports.items[0]?.id,
    "transport-option-id",
  );
  assert.equal(
    context.unselectedOptions.transports.items[0]?.isSelected,
    false,
  );
  assert.equal(selectedTransportIds.includes("transport-option-id"), false);
});

test("more than five selected items are retained without silent loss", () => {
  const activities = createContext().selectedItinerary.days.flatMap(
    (day) => day.activities,
  );

  assert.equal(activities.length, 6);
  assert.equal(activities[5]?.id, "activity-selected-6");
});

test("live weather and availability are explicitly qualified", () => {
  assert.match(
    TRIP_CHAT_SYSTEM_INSTRUCTION,
    /weather, availability, opening hours, current prices/i,
  );
  assert.match(
    TRIP_CHAT_SYSTEM_INSTRUCTION,
    /verify them with a current source/i,
  );
});

test("context and prompt retain stable day and item IDs", () => {
  const context = createContext();
  const prompt = buildTripChatPrompt({
    context,
    userMessage: "Review Day 1.",
  });

  assert.equal(context.tripOverview.tripId, "trip-stable-id");
  assert.equal(context.selectedItinerary.days[0]?.dayId, "day-stable-1");
  assert.match(prompt, /transport-selected-id/);
  assert.match(prompt, /activity-selected-6/);
  assert.match(prompt, /transport-option-id/);
});

test("recent chat history and proposal status remain in context", () => {
  const history = createContext().recentConversation;

  assert.equal(history.length, 2);
  assert.equal(history[0]?.role, "USER");
  assert.equal(history[1]?.proposalStatus, "APPLIED");
  assert.equal(history[1]?.proposalSummary, "Updated Day 1 pacing");
});
