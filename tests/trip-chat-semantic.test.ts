import assert from "node:assert/strict";
import test from "node:test";

import type { TripChatContext } from "../lib/ai/trip-chat/context";
import { processSemanticTripProposalAttempt } from "../lib/ai/trip-chat/proposal";
import {
  EXTENSION_DAY_TARGET,
  addTripChatEditCapabilities,
  parseTripChatProposalResponse,
} from "../lib/ai/trip-chat/semantic";

const day2 = "day-goa-2";
const day4 = "day-goa-4";
const day5 = "day-goa-5";
const departureId = "selected-departure-flight";
const paraglidingId = "option-paragliding";

function selectedItem(
  id: string,
  dayId: string,
  dayNumber: number,
  title: string,
  cost: number,
) {
  return {
    id,
    dayId,
    dayNumber,
    title,
    calculatedTripCost: cost,
    isSelected: true,
  };
}

function optionItem(
  id: string,
  dayId: string,
  dayNumber: number,
  title: string,
  cost: number,
) {
  return {
    id,
    dayId,
    dayNumber,
    title,
    calculatedTripCost: cost,
    isSelected: false,
  };
}

function day(
  dayId: string,
  dayNumber: number,
  title: string,
  transports: ReturnType<typeof selectedItem>[] = [],
) {
  return {
    dayId,
    dayNumber,
    title,
    description: title === `Day ${dayNumber}` ? null : `${title} itinerary`,
    notes: null,
    storedEstimatedCost: null,
    calculatedSelectedCost: transports.reduce(
      (total, item) => total + item.calculatedTripCost,
      0,
    ),
    transports,
    stays: [],
    meals: [],
    activities: [],
  };
}

function createContext({
  includeBlankDay5 = true,
  tripDays = includeBlankDay5 ? 5 : 4,
}: {
  includeBlankDay5?: boolean;
  tripDays?: number;
} = {}) {
  const selectedDeparture = selectedItem(
    departureId,
    day4,
    4,
    "Flight from Goa to Ahmedabad",
    5000,
  );
  const days = [
    day(day2, 2, "North Goa"),
    day(day4, 4, "Departure day", [selectedDeparture]),
  ];
  if (includeBlankDay5) days.push(day(day5, 5, "Day 5"));

  return {
    contextVersion: 1,
    tripOverview: {
      tripId: "trip-goa",
      title: "Goa trip",
      summary: null,
      origin: "Ahmedabad",
      destination: "Goa",
      tripDays,
      travellers: 2,
      currency: "INR",
    },
    preferences: {
      tripType: "FAMILY",
      travelPace: "MODERATE",
      foodPreference: "VEGETARIAN",
      transportPreference: "MIXED",
      specialNotes: null,
    },
    budgetFacts: {
      configuredBudget: 40000,
      currentEstimatedSelectedTotal: 21401,
      remainingBudget: 18599,
      exceededBy: null,
      percentageUsed: 53.5,
      costPerTraveller: 10700.5,
      costPerTripDay: 4280.2,
      budgetStatus: "BUDGET_FRIENDLY",
      categoryTotals: {
        transport: 5000,
        stays: 10000,
        meals: 3000,
        activities: 3401,
      },
      highestCostSelectedItems: [],
      costSemantics: [],
    },
    selectedItinerary: {
      meaning: "Items with isSelected=true are part of the final itinerary.",
      days,
      unassigned: { transports: [], stays: [] },
    },
    unselectedOptions: {
      meaning:
        "Items with isSelected=false are options only and are not part of the final itinerary.",
      optionLimitPerCategory: 20,
      activities: {
        totalCount: 1,
        includedCount: 1,
        omittedCount: 0,
        items: [
          optionItem(paraglidingId, day2, 2, "Paragliding at Arambol", 2500),
        ],
      },
      meals: { totalCount: 0, includedCount: 0, omittedCount: 0, items: [] },
      transports: {
        totalCount: 0,
        includedCount: 0,
        omittedCount: 0,
        items: [],
      },
      stays: { totalCount: 0, includedCount: 0, omittedCount: 0, items: [] },
    },
    recentConversation: [],
  } as unknown as TripChatContext;
}

function processProposal(text: string, baseContext = createContext()) {
  const context = addTripChatEditCapabilities(baseContext);
  const attempt = processSemanticTripProposalAttempt({ text, context });
  return {
    context,
    parsed: attempt.parsedProposal,
    compiled: attempt.compiled,
    validation: attempt.validation,
  };
}

test("the exact Goa extension reuses blank Day 5 and compiles a real proposal", () => {
  const result = processProposal(
    JSON.stringify({
      assistantMessage:
        "I can turn the empty final day into a North Goa day and move departure to it.",
      plan: {
        extendTrip: {
          title: "Arambol and departure",
          description: "Explore Arambol before departing.",
          reason: "Use the available budget and the existing empty Day 5.",
        },
        edits: [
          {
            type: "MOVE_SELECTED_ITEM",
            itemId: departureId,
            targetDay: EXTENSION_DAY_TARGET,
            reason: "Make Day 5 the departure day.",
          },
          {
            type: "USE_SAVED_OPTION",
            optionId: paraglidingId,
            targetDay: EXTENSION_DAY_TARGET,
            reason: "Use the saved Arambol activity.",
          },
          {
            type: "ADD_ITEM",
            category: "MEAL",
            targetDay: EXTENSION_DAY_TARGET,
            content: { title: "Breakfast in Arambol", mealType: "BREAKFAST" },
            reason: "Plan breakfast on the extended day.",
          },
          {
            type: "ADD_ITEM",
            category: "STAY",
            targetDay: day4,
            content: {
              title: "Unverified extra hostel night",
              stayType: "HOSTEL",
            },
            reason: "Support the extra night.",
          },
        ],
      },
    }),
  );

  assert.equal(
    result.context.editCapabilities.dayExtension.mode,
    "REUSE_BLANK_FINAL_DAY",
  );
  assert.equal(result.validation.result.responseMode, "PROPOSAL");
  assert.equal(result.validation.result.validChangeCount, 5);
  assert.equal(
    result.validation.changes.some((change) => change.type === "ADD_DAY"),
    false,
  );
  assert.equal(result.validation.changes[0]?.type, "UPDATE_DAY");
  assert.equal(result.validation.changes[0]?.dayId, day5);
  assert.equal(result.validation.changes[1]?.type, "MOVE_ITINERARY_ITEM");
  assert.equal(result.validation.changes[2]?.type, "SELECT_ACTIVITY_OPTION");
  assert.equal(result.validation.changes[2]?.dayId, day2);
  assert.equal(result.validation.changes[2]?.targetDayId, day5);
  assert.equal(result.validation.costPreview.verifiedTotalDelta, 2500);
  assert.equal(result.validation.costPreview.unknownCostChangeCount, 2);
  assert.equal(result.validation.recommendations[0]?.storedCost, 2500);
});

test("a populated four-day trip compiles one server-owned ADD_DAY and dependent targets", () => {
  const result = processProposal(
    JSON.stringify({
      assistantMessage: "I can add a fifth day.",
      plan: {
        extendTrip: { title: "North Goa", reason: "Add another usable day." },
        edits: [
          {
            type: "ADD_ITEM",
            category: "ACTIVITY",
            targetDay: EXTENSION_DAY_TARGET,
            content: {
              title: "Explore North Goa",
              activityCategory: "SIGHTSEEING",
            },
            reason: "Populate the new day.",
          },
        ],
      },
    }),
    createContext({ includeBlankDay5: false, tripDays: 4 }),
  );

  assert.equal(
    result.context.editCapabilities.dayExtension.mode,
    "ADD_NEW_DAY",
  );
  assert.deepEqual(
    result.validation.changes.map((change) => change.type),
    ["ADD_DAY", "ADD_ACTIVITY"],
  );
  const addedActivity = result.validation.changes[1];
  assert.equal(addedActivity?.type, "ADD_ACTIVITY");
  if (addedActivity?.type === "ADD_ACTIVITY") {
    assert.equal(addedActivity.dayRef, "extension_day");
  }
});

test("a trip at the 15-day limit rejects semantic extension", () => {
  const result = processProposal(
    JSON.stringify({
      assistantMessage: "I can extend it.",
      plan: {
        extendTrip: { title: "Another day", reason: "Extend the trip." },
        edits: [],
      },
    }),
    createContext({ includeBlankDay5: false, tripDays: 15 }),
  );

  assert.equal(
    result.context.editCapabilities.dayExtension.mode,
    "BLOCKED_MAX_DAYS",
  );
  assert.equal(result.validation.result.responseMode, "PROPOSAL_FAILED");
  assert.match(
    result.validation.result.rejectionReasons[0] ?? "",
    /15-day limit/i,
  );
});

test("semantic ADD_ITEM choices compile to category-specific stored actions", () => {
  const edits = [
    {
      type: "ADD_ITEM",
      category: "ACTIVITY",
      targetDay: day4,
      content: { title: "Sunset walk", activityCategory: "NATURE" },
      reason: "Add an activity.",
    },
    {
      type: "ADD_ITEM",
      category: "MEAL",
      targetDay: day4,
      content: { title: "Local breakfast", mealType: "BREAKFAST" },
      reason: "Add a meal.",
    },
    {
      type: "ADD_ITEM",
      category: "TRANSPORT",
      targetDay: day4,
      content: { title: "Local transfer", mode: "CAB" },
      reason: "Add transport.",
    },
    {
      type: "ADD_ITEM",
      category: "STAY",
      targetDay: day4,
      content: { title: "Unverified hostel", stayType: "HOSTEL" },
      reason: "Add a stay.",
    },
  ];
  const result = processProposal(
    JSON.stringify({
      assistantMessage: "I can add these planning ideas.",
      plan: { extendTrip: null, edits },
    }),
  );

  assert.deepEqual(
    result.validation.changes.map((change) => change.type),
    ["ADD_ACTIVITY", "ADD_MEAL", "ADD_TRANSPORT", "ADD_STAY"],
  );
  assert.equal(result.validation.result.validChangeCount, 4);
  assert.equal(result.validation.costPreview.unknownCostChangeCount, 4);
  const stay = result.validation.changes[3];
  assert.equal(stay?.type, "ADD_STAY");
  if (stay?.type === "ADD_STAY")
    assert.equal(stay.data.name, "Unverified hostel");
});

test("semantic ADD_ITEM retains a planning estimate without making it verified", () => {
  const result = processProposal(
    JSON.stringify({
      assistantMessage: "Add a planning-only meal.",
      plan: {
        extendTrip: null,
        edits: [
          {
            type: "ADD_ITEM",
            category: "MEAL",
            targetDay: day4,
            content: { title: "Planning breakfast", mealType: "BREAKFAST" },
            approximateCost: 650,
            reason: "A helpful breakfast option.",
          },
        ],
      },
    }),
  );

  const change = result.validation.changes[0];
  assert.equal(change?.type, "ADD_MEAL");
  if (change?.type === "ADD_MEAL") {
    assert.equal(change.aiEstimatedCost, 650);
    assert.equal(change.data.estimatedCost, null);
  }
  assert.equal(result.validation.costPreview.verifiedTotalDelta, 0);
  assert.equal(result.validation.costPreview.aiEstimatedTotal, 650);
  assert.equal(result.validation.costPreview.unknownCostChangeCount, 0);
});
test("one malformed semantic edit and assistant message do not erase a valid sibling", () => {
  const result = processProposal(
    JSON.stringify({
      assistantMessage: 42,
      plan: {
        extendTrip: null,
        edits: [
          {
            type: "USE_SAVED_OPTION",
            optionId: paraglidingId,
            targetDay: day4,
            reason: "Use the stored option.",
          },
          {
            type: "ADD_ITEM",
            category: "MEAL",
            targetDay: day4,
            content: { mealType: "LUNCH" },
            reason: "Missing its title.",
          },
        ],
      },
    }),
  );

  assert.equal(result.parsed.proposal.plan.edits.length, 1);
  assert.equal(result.validation.result.responseMode, "PROPOSAL");
  assert.equal(result.validation.result.validChangeCount, 1);
  assert.ok(
    result.parsed.issues.some((issue) => issue.startsWith("assistantMessage")),
  );
  assert.ok(result.validation.result.rejectedChangeCount > 0);
});

test("model-generated cost fields are rejected without removing a valid saved option", () => {
  const result = processProposal(
    JSON.stringify({
      assistantMessage: "I can use the saved option and add another idea.",
      plan: {
        extendTrip: null,
        edits: [
          {
            type: "USE_SAVED_OPTION",
            optionId: paraglidingId,
            targetDay: day4,
            reason: "Use the stored option.",
          },
          {
            type: "ADD_ITEM",
            category: "MEAL",
            targetDay: day4,
            content: {
              title: "Invented cafe",
              mealType: "DINNER",
              estimatedCost: 1800,
            },
            reason: "Add dinner.",
          },
        ],
      },
    }),
  );

  assert.equal(result.validation.result.validChangeCount, 1);
  assert.equal(result.validation.costPreview.verifiedTotalDelta, 2500);
  assert.equal(result.validation.costPreview.unknownCostChangeCount, 0);
  assert.ok(
    result.parsed.rejectedEditReasons.some((reason) =>
      /estimatedCost/i.test(reason),
    ),
  );
});

test("more than eight semantic edits are reported instead of silently lost", () => {
  const edits = Array.from({ length: 9 }, () => ({
    type: "MOVE_SELECTED_ITEM",
    itemId: departureId,
    targetDay: day2,
    reason: "Move departure.",
  }));
  const parsed = parseTripChatProposalResponse(
    JSON.stringify({
      assistantMessage: "Move these items.",
      plan: { extendTrip: null, edits },
    }),
  );

  assert.equal(parsed.proposal.plan.edits.length, 8);
  assert.match(
    parsed.rejectedEditReasons.at(-1) ?? "",
    /8-total-change limit/i,
  );
});

test("all semantic update and remove operations map to stored action types", () => {
  const mappingContext = createContext();
  const targetDay = mappingContext.selectedItinerary.days.find(
    (candidate) => candidate.dayId === day4,
  );
  assert.ok(targetDay);
  targetDay.activities.push({
    ...selectedItem("selected-activity", day4, 4, "Fort walk", 500),
    description: null,
    locationName: null,
    address: null,
    startTime: null,
    endTime: null,
    durationMinutes: null,
    category: "SIGHTSEEING",
    estimatedCost: 500,
    notes: null,
    position: 0,
  });
  targetDay.meals.push({
    ...selectedItem("selected-meal", day4, 4, "Saved lunch", 700),
    mealType: "LUNCH",
    locationName: null,
    estimatedCost: 700,
    notes: null,
  });
  targetDay.stays.push({
    ...selectedItem("selected-stay", day4, 4, "Saved stay", 1500),
    name: "Saved stay",
    city: "Goa",
    area: null,
    stayType: "HOSTEL",
    budgetLevel: "BUDGET",
    pricePerNight: 1500,
    nights: 1,
    totalCost: 1500,
    bestFor: null,
    notes: null,
  });

  const result = processProposal(
    JSON.stringify({
      assistantMessage: "I can update and remove these saved items.",
      plan: {
        extendTrip: null,
        edits: [
          {
            type: "UPDATE_SELECTED_ITEM",
            itemId: "selected-activity",
            content: { notes: "Start earlier." },
            reason: "Improve the timing.",
          },
          {
            type: "UPDATE_SELECTED_ITEM",
            itemId: "selected-meal",
            content: { notes: "Keep this flexible." },
            reason: "Improve the meal plan.",
          },
          {
            type: "UPDATE_SELECTED_ITEM",
            itemId: departureId,
            content: { notes: "Confirm before departure." },
            reason: "Clarify the transfer.",
          },
          {
            type: "UPDATE_SELECTED_ITEM",
            itemId: "selected-stay",
            content: { notes: "Request a quiet room." },
            reason: "Improve the stay.",
          },
          {
            type: "REMOVE_SELECTED_ITEM",
            itemId: "selected-activity",
            reason: "Remove the activity.",
          },
          {
            type: "REMOVE_SELECTED_ITEM",
            itemId: "selected-meal",
            reason: "Remove the meal.",
          },
          {
            type: "REMOVE_SELECTED_ITEM",
            itemId: departureId,
            reason: "Remove the transport.",
          },
          {
            type: "REMOVE_SELECTED_ITEM",
            itemId: "selected-stay",
            reason: "Remove the stay.",
          },
        ],
      },
    }),
    mappingContext,
  );

  assert.deepEqual(
    result.compiled.rawChanges.map((change) => change.type),
    [
      "UPDATE_ACTIVITY",
      "UPDATE_MEAL",
      "UPDATE_TRANSPORT",
      "UPDATE_STAY",
      "DELETE_ACTIVITY",
      "DELETE_MEAL",
      "DELETE_TRANSPORT",
      "DELETE_STAY",
    ],
  );
});

test("UPDATE_DAY and saved-option replacement compile with grounded IDs", () => {
  const replacementContext = createContext();
  const targetDay = replacementContext.selectedItinerary.days.find(
    (candidate) => candidate.dayId === day4,
  );
  assert.ok(targetDay);
  targetDay.activities.push({
    ...selectedItem("selected-old-activity", day4, 4, "Old activity", 900),
    description: null,
    locationName: null,
    address: null,
    startTime: null,
    endTime: null,
    durationMinutes: null,
    category: "SIGHTSEEING",
    estimatedCost: 900,
    notes: null,
    position: 0,
  });

  const result = processProposal(
    JSON.stringify({
      assistantMessage: "I can improve Day 4 with the saved option.",
      plan: {
        extendTrip: null,
        edits: [
          {
            type: "UPDATE_DAY",
            dayId: day4,
            content: { title: "Arambol and departure" },
            reason: "Describe the revised day.",
          },
          {
            type: "USE_SAVED_OPTION",
            optionId: paraglidingId,
            targetDay: day4,
            replaceItemId: "selected-old-activity",
            reason: "Use the saved activity instead.",
          },
        ],
      },
    }),
    replacementContext,
  );

  assert.equal(result.compiled.rawChanges[0]?.type, "UPDATE_DAY");
  const selection = result.compiled.rawChanges[1];
  assert.equal(selection?.type, "SELECT_ACTIVITY_OPTION");
  if (selection?.type === "SELECT_ACTIVITY_OPTION") {
    assert.equal(selection.optionId, paraglidingId);
    assert.equal(selection.dayId, day2);
    assert.equal(selection.targetDayId, day4);
    assert.equal(selection.replaceSelectedItemId, "selected-old-activity");
  }
  const recommendation = result.validation.recommendations[0];
  assert.equal(recommendation?.provenance, "EXISTING_OPTION");
  assert.equal(
    recommendation && "itemId" in recommendation ? recommendation.itemId : null,
    paraglidingId,
  );
  assert.equal(recommendation?.storedCost, 2500);
  assert.equal(recommendation?.costVerified, true);
  assert.equal(recommendation?.resolvedTitle, "Paragliding at Arambol");
});

test("invalid semantic IDs do not erase a valid sibling", () => {
  const result = processProposal(
    JSON.stringify({
      assistantMessage: "I can add a meal while checking the saved option.",
      plan: {
        extendTrip: null,
        edits: [
          {
            type: "USE_SAVED_OPTION",
            optionId: "option-from-another-trip",
            targetDay: day4,
            reason: "Try the saved option.",
          },
          {
            type: "ADD_ITEM",
            category: "MEAL",
            targetDay: day4,
            content: { title: "Flexible dinner", mealType: "DINNER" },
            reason: "Complete the day.",
          },
        ],
      },
    }),
  );

  assert.equal(result.validation.result.responseMode, "PROPOSAL");
  assert.equal(result.validation.result.validChangeCount, 1);
  assert.equal(result.validation.result.rejectedChangeCount, 1);
  assert.equal(result.validation.changes[0]?.type, "ADD_MEAL");
  assert.match(
    result.validation.result.rejectionReasons[0] ?? "",
    /outside|not available|not part/i,
  );
});

test("an empty semantic UPDATE_DAY is rejected without losing a valid sibling", () => {
  const result = processProposal(
    JSON.stringify({
      assistantMessage: "I can revise the day and add dinner.",
      plan: {
        extendTrip: null,
        edits: [
          {
            type: "UPDATE_DAY",
            dayId: day4,
            content: {},
            reason: "Revise the day.",
          },
          {
            type: "ADD_ITEM",
            category: "MEAL",
            targetDay: day4,
            content: { title: "Flexible dinner", mealType: "DINNER" },
            reason: "Complete the day.",
          },
        ],
      },
    }),
  );

  assert.equal(result.validation.result.validChangeCount, 1);
  assert.equal(result.validation.result.rejectedChangeCount, 1);
  assert.equal(result.validation.changes[0]?.type, "ADD_MEAL");
  assert.ok(
    result.parsed.issues.some((issue) =>
      /At least one day field is required/i.test(issue),
    ),
  );
});

test("a content-free final day is reused even when it has a custom title", () => {
  const customTitleContext = createContext();
  const finalDay = customTitleContext.selectedItinerary.days.find(
    (candidate) => candidate.dayId === day5,
  );
  assert.ok(finalDay);
  finalDay.title = "Extra day placeholder";
  finalDay.description = null;

  const context = addTripChatEditCapabilities(customTitleContext);
  assert.equal(
    context.editCapabilities.dayExtension.mode,
    "REUSE_BLANK_FINAL_DAY",
  );
});

test("new items cannot duplicate a selected stay or recreate a saved option by name", () => {
  const duplicateContext = createContext();
  const targetDay = duplicateContext.selectedItinerary.days.find(
    (candidate) => candidate.dayId === day4,
  );
  assert.ok(targetDay);
  targetDay.stays.push({
    ...selectedItem("selected-wanderers", day4, 4, "Wanderers Hostel", 1000),
    name: "Wanderers Hostel",
    city: "Goa",
    area: null,
    stayType: "HOSTEL",
    budgetLevel: "BUDGET",
    pricePerNight: 1000,
    nights: 1,
    totalCost: 1000,
    bestFor: null,
    notes: null,
  });

  const result = processProposal(
    JSON.stringify({
      assistantMessage: "I can add these ideas.",
      plan: {
        extendTrip: null,
        edits: [
          {
            type: "ADD_ITEM",
            category: "STAY",
            targetDay: day5,
            content: { title: "Wanderers Hostel", stayType: "HOSTEL" },
            reason: "Extend the current accommodation.",
          },
          {
            type: "ADD_ITEM",
            category: "ACTIVITY",
            targetDay: day4,
            content: {
              title: "Paragliding at Arambol",
              activityCategory: "ADVENTURE",
            },
            reason: "Add the saved adventure.",
          },
          {
            type: "ADD_ITEM",
            category: "MEAL",
            targetDay: day4,
            content: { title: "Flexible dinner", mealType: "DINNER" },
            reason: "Complete the day.",
          },
        ],
      },
    }),
    duplicateContext,
  );

  assert.equal(result.validation.result.validChangeCount, 1);
  assert.equal(result.validation.result.rejectedChangeCount, 2);
  assert.equal(result.validation.changes[0]?.type, "ADD_MEAL");
  assert.ok(
    result.validation.result.rejectionReasons.some((reason) =>
      /already selected/i.test(reason),
    ),
  );
  assert.ok(
    result.validation.result.rejectionReasons.some((reason) =>
      /USE_SAVED_OPTION.*option-paragliding/i.test(reason),
    ),
  );
});

test("an explicit selected-item price correction compiles into an applyable price update", () => {
  const result = processProposal(
    JSON.stringify({
      assistantMessage:
        "I prepared a price estimate for the selected transport.",
      plan: {
        extendTrip: null,
        edits: [
          {
            type: "UPDATE_SELECTED_ITEM",
            itemId: departureId,
            content: {},
            approximateCost: 1400,
            reason: "Add an approximate price requested by the user.",
          },
        ],
      },
    }),
    createContext(),
  );

  assert.equal(result.validation.result.validChangeCount, 1);
  const change = result.validation.changes[0];
  assert.equal(change?.type, "UPDATE_TRANSPORT");
  if (change?.type === "UPDATE_TRANSPORT") {
    assert.equal(change.data.totalCost, 1400);
  }
  assert.equal(result.validation.costPreview.changes[0]?.afterCost, 1400);
  assert.equal(
    result.validation.costPreview.changes[0]?.isAiPriceEstimate,
    true,
  );
});

test("a Gemini price alias inside content still creates a reviewable price proposal", () => {
  const result = processProposal(
    JSON.stringify({
      assistantMessage: "I can correct that saved transport estimate for review.",
      plan: {
        extendTrip: null,
        edits: [
          {
            type: "UPDATE_SELECTED_ITEM",
            itemId: departureId,
            content: { price: "18" },
            reason: "Correct the amount entered by mistake.",
          },
        ],
      },
    }),
    createContext(),
  );

  assert.equal(result.parsed.rejectedEditReasons.length, 0);
  assert.equal(result.validation.result.responseMode, "PROPOSAL");
  assert.equal(result.validation.result.validChangeCount, 1);
  const change = result.validation.changes[0];
  assert.equal(change?.type, "UPDATE_TRANSPORT");
  if (change?.type === "UPDATE_TRANSPORT") {
    assert.equal(change.data.totalCost, 18);
    assert.equal(change.data.costType, "TOTAL");
  }
});

test("a price-only update accepts null content when Gemini supplies a top-level price", () => {
  const result = processProposal(
    JSON.stringify({
      assistantMessage: "I can correct that saved transport estimate for review.",
      plan: {
        extendTrip: null,
        edits: [
          {
            type: "UPDATE_SELECTED_ITEM",
            itemId: departureId,
            content: null,
            totalCost: "₹1,800",
            reason: "Correct the amount entered by mistake.",
          },
        ],
      },
    }),
    createContext(),
  );

  assert.equal(result.parsed.rejectedEditReasons.length, 0);
  assert.equal(result.validation.result.responseMode, "PROPOSAL");
  assert.equal(result.validation.result.validChangeCount, 1);
  const change = result.validation.changes[0];
  assert.equal(change?.type, "UPDATE_TRANSPORT");
  if (change?.type === "UPDATE_TRANSPORT") {
    assert.equal(change.data.totalCost, 1800);
  }
});

test("an empty semantic plan is a normal Gemini-selected answer, not a proposal failure", () => {
  const result = processProposal(
    JSON.stringify({
      assistantMessage: "Your current transport plan already fits the saved budget.",
      plan: { extendTrip: null, edits: [] },
    }),
  );

  assert.equal(result.validation.result.responseMode, "ANSWER");
  assert.equal(result.validation.result.proposalCreated, false);
  assert.equal(result.validation.result.validChangeCount, 0);
});