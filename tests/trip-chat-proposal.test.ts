import assert from "node:assert/strict";
import test from "node:test";

import type { TripChatContext } from "../lib/ai/trip-chat/context";
import {
  buildTruthfulAssistantMessage,
  createStoredTripChatPayload,
  parseStoredTripChatPayload,
  validateAiTripResponse,
} from "../lib/ai/trip-chat/proposal";

const day3 = "day-jaipur-3";
const day4 = "day-jaipur-4";
const day7 = "day-jaipur-7";

function item(
  id: string,
  dayId: string,
  dayNumber: number,
  title: string,
  cost: number,
  isSelected: boolean,
) {
  return { id, dayId, dayNumber, title, calculatedTripCost: cost, isSelected };
}

const context = {
  tripOverview: { tripId: "trip-rajasthan", currency: "INR", tripDays: 7 },
  budgetFacts: {
    configuredBudget: 70000,
    currentEstimatedSelectedTotal: 59450,
    remainingBudget: 10550,
    exceededBy: null,
  },
  selectedItinerary: {
    days: [
      {
        dayId: day3,
        dayNumber: 3,
        activities: [],
        meals: [
          item(
            "meal-krishna",
            day3,
            3,
            "Dinner at Krishna Dal Bati Restro",
            1000,
            true,
          ),
        ],
        transports: [],
        stays: [
          item("stay-fixed", day3, 3, "Stored selected stays", 53950, true),
        ],
      },
      {
        dayId: day4,
        dayNumber: 4,
        activities: [],
        meals: [],
        stays: [],
        transports: [
          item(
            "transport-train",
            day4,
            4,
            "Train from Udaipur to Jaipur",
            3000,
            true,
          ),
        ],
      },
      {
        dayId: day7,
        dayNumber: 7,
        activities: [],
        transports: [],
        stays: [],
        meals: [
          item("meal-handi", day7, 7, "Farewell Lunch at Handi", 1500, true),
        ],
      },
    ],
    unassigned: { transports: [], stays: [] },
  },
  unselectedOptions: {
    activities: {
      items: [
        item(
          "activity-elephant",
          day4,
          4,
          "Elephant Ride at Amber Fort",
          1800,
          false,
        ),
        item(
          "activity-albert",
          day4,
          4,
          "Visit Albert Hall Museum",
          450,
          false,
        ),
      ],
      totalCount: 2,
      includedCount: 2,
      omittedCount: 0,
    },
    meals: {
      items: [
        item("meal-upre", day3, 3, "Dinner at Upre by 1559 AD", 2000, false),
        item("meal-chokhi", day7, 7, "Lunch at Chokhi Dhani", 2700, false),
      ],
      totalCount: 2,
      includedCount: 2,
      omittedCount: 0,
    },
    transports: {
      items: [
        item(
          "transport-cab",
          day4,
          4,
          "Private Cab from Udaipur to Jaipur",
          9000,
          false,
        ),
      ],
      totalCount: 1,
      includedCount: 1,
      omittedCount: 0,
    },
    stays: {
      items: [
        item("stay-option", day3, 3, "Saved luxury stay option", 60000, false),
      ],
      totalCount: 1,
      includedCount: 1,
      omittedCount: 0,
    },
  },
} as unknown as TripChatContext;

function select(
  type: string,
  optionId: string,
  dayId: string,
  replaceSelectedItemId?: string,
) {
  return {
    type,
    optionId,
    dayId,
    replaceSelectedItemId,
    label: `Select ${optionId}`,
    reason: "Use the saved option.",
  };
}

test("existing option recommendation resolves the real ID and stored cost", () => {
  const result = validateAiTripResponse({
    rawRecommendations: [
      {
        provenance: "EXISTING_OPTION",
        category: "TRANSPORT",
        itemId: "transport-cab",
        dayId: day4,
        title: "Cab",
        reason: "More comfortable.",
      },
    ],
    rawChanges: [],
    context,
    proposalExpected: false,
  });
  const recommendation = result.recommendations[0];
  assert.ok(recommendation && "itemId" in recommendation);
  assert.equal(recommendation.itemId, "transport-cab");
  assert.equal(recommendation.storedCost, 9000);
  assert.equal(
    recommendation.resolvedTitle,
    "Private Cab from Udaipur to Jaipur",
  );
});

test("invented venue cannot masquerade as an existing option", () => {
  const result = validateAiTripResponse({
    rawRecommendations: [
      {
        provenance: "EXISTING_OPTION",
        category: "MEAL",
        itemId: "invented-id",
        dayId: day3,
        title: "Invented Palace",
        reason: "Luxury.",
      },
    ],
    rawChanges: [],
    context,
    proposalExpected: false,
  });
  assert.equal(result.recommendations.length, 0);
  assert.match(
    result.result.rejectionReasons[0] ?? "",
    /does not match this trip/,
  );
});

test("invented exact recommendation price is rejected as unverified output", () => {
  const result = validateAiTripResponse({
    rawRecommendations: [
      {
        provenance: "NEW_AI_SUGGESTION",
        category: "MEAL",
        title: "Invented Palace",
        reason: "Try it.",
        exactCost: 1000,
      },
    ],
    rawChanges: [],
    context,
    proposalExpected: false,
  });
  assert.equal(result.recommendations.length, 0);
  assert.equal(result.result.rejectionReasons.length, 1);
});

test("verified proposal total is computed from stored costs, not model totals", () => {
  const result = validateAiTripResponse({
    rawRecommendations: [],
    rawChanges: [
      select(
        "SELECT_TRANSPORT_OPTION",
        "transport-cab",
        day4,
        "transport-train",
      ),
    ],
    context,
    proposalExpected: true,
  });
  assert.equal(result.costPreview.verifiedTotalDelta, 6000);
  assert.equal(result.costPreview.resultingEstimatedTotal, 65450);
});

test("assistant contract does not claim proposal success for zero valid changes", () => {
  const result = validateAiTripResponse({
    rawRecommendations: [],
    rawChanges: [],
    context,
    proposalExpected: true,
  });
  assert.equal(result.result.responseMode, "PROPOSAL_FAILED");
  assert.equal(result.result.proposalCreated, false);
});

test("invalid changes with otherwise valid prose are a failed proposal", () => {
  const result = validateAiTripResponse({
    rawRecommendations: [],
    rawChanges: [{ type: "SELECT_MEAL_OPTION", optionId: "missing" }],
    context,
    proposalExpected: true,
  });
  assert.equal(result.result.responseMode, "PROPOSAL_FAILED");
  assert.equal(result.result.rejectedChangeCount, 1);
});

test("option ID outside this trip is rejected", () => {
  const result = validateAiTripResponse({
    rawRecommendations: [],
    rawChanges: [select("SELECT_MEAL_OPTION", "other-trip-option", day3)],
    context,
    proposalExpected: true,
  });
  assert.equal(result.changes.length, 0);
  assert.match(result.result.rejectionReasons[0] ?? "", /option is missing/);
});

test("already-selected item cannot be selected again as an option", () => {
  const result = validateAiTripResponse({
    rawRecommendations: [],
    rawChanges: [select("SELECT_MEAL_OPTION", "meal-krishna", day3)],
    context,
    proposalExpected: true,
  });
  assert.equal(result.changes.length, 0);
});

test("unknown-cost additions are excluded from confirmed budget calculation", () => {
  const result = validateAiTripResponse({
    rawRecommendations: [],
    rawChanges: [
      {
        type: "ADD_MEAL",
        dayId: day3,
        label: "Add unverified meal",
        reason: "AI idea",
        data: {
          mealType: "DINNER",
          title: "Unverified restaurant",
          estimatedCost: 9999,
        },
      },
    ],
    context,
    proposalExpected: true,
  });
  assert.equal(result.costPreview.verifiedTotalDelta, 0);
  assert.equal(result.costPreview.unknownCostChangeCount, 1);
  assert.equal(result.costPreview.resultingRemainingBudget, 10550);
  assert.equal(
    (result.changes[0] as { data: { estimatedCost: number | null } }).data
      .estimatedCost,
    null,
  );
});

test("AI planning estimates are displayed but excluded from confirmed totals", () => {
  const result = validateAiTripResponse({
    rawRecommendations: [],
    rawChanges: [
      {
        type: "ADD_MEAL",
        dayId: day3,
        label: "Add a planning-only dinner",
        reason: "A new AI-created idea.",
        aiEstimatedCost: 1800,
        data: {
          mealType: "DINNER",
          title: "Planning-only dinner",
          estimatedCost: 1800,
        },
      },
    ],
    context,
    proposalExpected: true,
  });

  assert.equal(result.costPreview.verifiedTotalDelta, 0);
  assert.equal(result.costPreview.aiEstimatedTotal, 1800);
  assert.equal(result.costPreview.aiEstimatedChangeCount, 1);
  assert.equal(result.costPreview.unknownCostChangeCount, 0);
  assert.equal(result.costPreview.changes[0]?.aiEstimatedCost, 1800);
  assert.equal(
    (result.changes[0] as { data: { estimatedCost: number | null } }).data
      .estimatedCost,
    null,
  );
  assert.match(
    buildTruthfulAssistantMessage({
      modelMessage: "Here is one new dinner idea.",
      validation: result,
      context,
    }),
    /AI planning estimates.*INR 1,800.*excluded from the confirmed total/i,
  );
});
test("Gemini-generated ADD_STAY remains a proposal with unknown unverified cost", () => {
  const result = validateAiTripResponse({
    rawRecommendations: [],
    rawChanges: [
      {
        type: "ADD_STAY",
        dayId: day3,
        label: "Add an AI-created luxury stay",
        reason: "Gemini selected this supported action.",
        data: { name: "Unverified luxury stay", totalCost: 25000 },
      },
    ],
    context,
    proposalExpected: true,
  });

  assert.equal(result.result.responseMode, "PROPOSAL");
  assert.equal(result.result.validChangeCount, 1);
  assert.equal(result.costPreview.unknownCostChangeCount, 1);
  assert.equal(result.costPreview.verifiedTotalDelta, 0);
  assert.equal(
    (result.changes[0] as { data: { totalCost: number | null } }).data
      .totalCost,
    null,
  );
});

test("Gemini-generated SELECT_STAY_OPTION uses its real stored option cost", () => {
  const result = validateAiTripResponse({
    rawRecommendations: [],
    rawChanges: [
      select("SELECT_STAY_OPTION", "stay-option", day3, "stay-fixed"),
    ],
    context,
    proposalExpected: true,
  });

  assert.equal(result.result.responseMode, "PROPOSAL");
  assert.equal(result.costPreview.changes[0]?.beforeCost, 53950);
  assert.equal(result.costPreview.changes[0]?.afterCost, 60000);
  assert.equal(result.costPreview.changes[0]?.delta, 6050);
});

test("mixed Gemini actions preserve valid changes and report rejected ones", () => {
  const result = validateAiTripResponse({
    rawRecommendations: [],
    rawChanges: [
      select("SELECT_MEAL_OPTION", "meal-upre", day3, "meal-krishna"),
      select("SELECT_MEAL_OPTION", "invented-option", day3),
    ],
    context,
    proposalExpected: true,
  });

  assert.equal(result.result.responseMode, "PROPOSAL");
  assert.equal(result.result.validChangeCount, 1);
  assert.equal(result.result.rejectedChangeCount, 1);
  assert.equal(result.changes.length, 1);
});

test("reported Rajasthan scenario uses five real options and a deterministic INR 10,450 delta", () => {
  const changes = [
    select("SELECT_TRANSPORT_OPTION", "transport-cab", day4, "transport-train"),
    select("SELECT_MEAL_OPTION", "meal-upre", day3, "meal-krishna"),
    select("SELECT_ACTIVITY_OPTION", "activity-elephant", day4),
    select("SELECT_ACTIVITY_OPTION", "activity-albert", day4),
    select("SELECT_MEAL_OPTION", "meal-chokhi", day7, "meal-handi"),
  ];
  const result = validateAiTripResponse({
    rawRecommendations: [],
    rawChanges: changes,
    context,
    proposalExpected: true,
  });
  assert.equal(result.result.validChangeCount, 5);
  assert.equal(result.costPreview.verifiedTotalDelta, 10450);
  assert.equal(result.costPreview.resultingRemainingBudget, 100);
  assert.deepEqual(
    result.costPreview.changes.map((change) => change.afterCost),
    [9000, 2000, 1800, 450, 2700],
  );
});
test("proposal assistant copy is concise and leaves details to the review card", () => {
  const validation = validateAiTripResponse({
    rawRecommendations: [
      {
        provenance: "EXISTING_OPTION",
        category: "TRANSPORT",
        itemId: "transport-cab",
        dayId: day4,
        title: "Private Cab from Udaipur to Jaipur",
        reason: "A more comfortable transfer.",
      },
    ],
    rawChanges: [
      select(
        "SELECT_TRANSPORT_OPTION",
        "transport-cab",
        day4,
        "transport-train",
      ),
    ],
    context,
    proposalExpected: true,
  });

  const message = buildTruthfulAssistantMessage({
    modelMessage: "I've added a full new day and moved the departure.",
    validation,
    context,
  });

  assert.match(message, /practical update/i);
  assert.doesNotMatch(message, /I've added/i);
  assert.match(message, /1 change is ready for review/);
  assert.match(message, /Nothing has been applied/);
  assert.doesNotMatch(
    message,
    /validated change|AI planning rationale|Private Cab from Udaipur to Jaipur/i,
  );
  assert.ok(message.split("\n\n").length <= 4);
});

test("previous saved-option provenance remains authoritative on follow-up", () => {
  const previous = validateAiTripResponse({
    rawRecommendations: [
      {
        provenance: "EXISTING_OPTION",
        category: "MEAL",
        itemId: "meal-upre",
        dayId: day3,
        title: "Dinner at Upre by 1559 AD",
        reason: "Use the saved option.",
      },
    ],
    rawChanges: [],
    context,
    proposalExpected: false,
  }).recommendations;

  const followUp = validateAiTripResponse({
    rawRecommendations: [
      {
        provenance: "NEW_AI_SUGGESTION",
        category: "MEAL",
        dayId: day3,
        title: "Dinner at Upre by 1559 AD",
        reason: "Prepare the previously discussed dinner.",
      },
    ],
    rawChanges: [],
    context,
    proposalExpected: false,
    previousRecommendations: previous,
  });

  assert.equal(followUp.recommendations[0]?.provenance, "EXISTING_OPTION");
  assert.equal(
    "itemId" in (followUp.recommendations[0] ?? {})
      ? followUp.recommendations[0].itemId
      : null,
    "meal-upre",
  );
  assert.equal(followUp.recommendations[0]?.storedCost, 2000);
});

test("one ADD_DAY can supply a target for dependent Gemini actions", () => {
  const fourDayContext = {
    ...context,
    tripOverview: { ...context.tripOverview, tripDays: 4 },
  } as TripChatContext;
  const result = validateAiTripResponse({
    rawRecommendations: [],
    rawChanges: [
      {
        type: "ADD_DAY",
        dayRef: "new_day_1",
        label: "Add Day 5",
        reason: "Extend the trip.",
        data: { title: "North Goa" },
      },
      {
        type: "ADD_ACTIVITY",
        dayRef: "new_day_1",
        label: "Add a North Goa activity",
        reason: "Populate the new day.",
        data: { title: "Explore North Goa", category: "SIGHTSEEING" },
      },
    ],
    context: fourDayContext,
    proposalExpected: true,
  });

  assert.equal(result.result.responseMode, "PROPOSAL");
  assert.equal(result.result.validChangeCount, 2);
  assert.equal(result.costPreview.changes[0]?.delta, 0);
  assert.equal(result.costPreview.unknownCostChangeCount, 1);
});

test("unknown, duplicate, and over-limit new-day references are rejected", () => {
  const normalContext = {
    ...context,
    tripOverview: { ...context.tripOverview, tripDays: 4 },
  } as TripChatContext;
  const unknown = validateAiTripResponse({
    rawRecommendations: [],
    rawChanges: [
      {
        type: "ADD_MEAL",
        dayRef: "missing_day",
        label: "Add breakfast",
        reason: "Use the new day.",
        data: { mealType: "BREAKFAST", title: "Breakfast" },
      },
    ],
    context: normalContext,
    proposalExpected: true,
  });
  assert.equal(unknown.result.validChangeCount, 0);
  assert.match(unknown.result.rejectionReasons[0] ?? "", /day reference/i);

  const duplicate = validateAiTripResponse({
    rawRecommendations: [],
    rawChanges: [
      {
        type: "ADD_DAY",
        dayRef: "new_day_1",
        label: "Day 5",
        reason: "Extend.",
        data: {},
      },
      {
        type: "ADD_DAY",
        dayRef: "new_day_2",
        label: "Day 6",
        reason: "Extend again.",
        data: {},
      },
    ],
    context: normalContext,
    proposalExpected: true,
  });
  assert.equal(duplicate.result.validChangeCount, 0);
  assert.equal(duplicate.result.rejectedChangeCount, 2);

  const maxContext = {
    ...context,
    tripOverview: { ...context.tripOverview, tripDays: 15 },
  } as TripChatContext;
  const overLimit = validateAiTripResponse({
    rawRecommendations: [],
    rawChanges: [
      {
        type: "ADD_DAY",
        dayRef: "new_day_1",
        label: "Add another day",
        reason: "Extend.",
        data: {},
      },
    ],
    context: maxContext,
    proposalExpected: true,
  });
  assert.equal(overLimit.result.validChangeCount, 0);
  assert.match(overLimit.result.rejectionReasons[0] ?? "", /15-day limit/i);
});

test("selected items can move to another real day with zero cost delta", () => {
  const result = validateAiTripResponse({
    rawRecommendations: [],
    rawChanges: [
      {
        type: "MOVE_ITINERARY_ITEM",
        category: "TRANSPORT",
        itemId: "transport-train",
        fromDayId: day4,
        targetDayId: day3,
        label: "Move departure transport",
        reason: "Keep departure travel on the final day.",
      },
    ],
    context,
    proposalExpected: true,
  });

  assert.equal(result.result.validChangeCount, 1);
  assert.equal(result.costPreview.changes[0]?.costVerified, true);
  assert.equal(result.costPreview.changes[0]?.delta, 0);
});

test("saved options retain their source day while targeting another day", () => {
  const result = validateAiTripResponse({
    rawRecommendations: [],
    rawChanges: [
      {
        type: "SELECT_ACTIVITY_OPTION",
        optionId: "activity-elephant",
        dayId: day4,
        targetDayId: day3,
        label: "Use saved activity on Day 3",
        reason: "It fits the revised pacing.",
      },
    ],
    context,
    proposalExpected: true,
  });

  assert.equal(result.result.validChangeCount, 1);
  assert.equal(result.costPreview.changes[0]?.afterCost, 1800);
  assert.equal(result.costPreview.verifiedTotalDelta, 1800);
});

test("Goa blank-Day-5 proposal updates the saved day instead of requiring Day 6", () => {
  const day2 = "day-goa-2";
  const day5 = "day-goa-5";
  const goaContext = structuredClone(context) as TripChatContext;
  goaContext.tripOverview.tripDays = 5;
  goaContext.selectedItinerary.days = goaContext.selectedItinerary.days.filter(
    (day) => day.dayNumber <= 4,
  );
  goaContext.selectedItinerary.days.push(
    {
      dayId: day2,
      dayNumber: 2,
      title: "North Goa",
      description: "Saved Day 2",
      notes: null,
      storedEstimatedCost: null,
      calculatedSelectedCost: 0,
      transports: [],
      stays: [],
      meals: [],
      activities: [],
    },
    {
      dayId: day5,
      dayNumber: 5,
      title: "Day 5",
      description: null,
      notes: null,
      storedEstimatedCost: null,
      calculatedSelectedCost: 0,
      transports: [],
      stays: [],
      meals: [],
      activities: [],
    },
  );
  goaContext.unselectedOptions.activities.items = [
    {
      id: "paragliding-arambol",
      dayId: day2,
      dayNumber: 2,
      title: "Paragliding at Arambol",
      description: "Saved activity option.",
      locationName: "Arambol",
      address: null,
      startTime: null,
      endTime: null,
      durationMinutes: null,
      category: "ADVENTURE",
      estimatedCost: 2500,
      calculatedTripCost: 2500,
      notes: null,
      position: 0,
      isSelected: false,
    },
  ];
  goaContext.unselectedOptions.activities.totalCount = 1;
  goaContext.unselectedOptions.activities.includedCount = 1;

  const result = validateAiTripResponse({
    rawRecommendations: [],
    rawChanges: [
      {
        type: "UPDATE_DAY",
        dayId: day5,
        label: "Plan Day 5",
        reason: "Use the existing blank day.",
        data: { title: "Arambol and departure" },
      },
      {
        type: "MOVE_ITINERARY_ITEM",
        category: "TRANSPORT",
        itemId: "transport-train",
        fromDayId: day4,
        targetDayId: day5,
        label: "Move departure transport",
        reason: "Make Day 5 the departure day.",
      },
      {
        type: "SELECT_ACTIVITY_OPTION",
        optionId: "paragliding-arambol",
        dayId: day2,
        targetDayId: day5,
        label: "Use saved paragliding option",
        reason: "Add a saved activity to Day 5.",
      },
      {
        type: "ADD_MEAL",
        dayId: day5,
        label: "Add breakfast",
        reason: "Plan the extended day.",
        data: { mealType: "BREAKFAST", title: "Breakfast at a local cafe" },
      },
    ],
    context: goaContext,
    proposalExpected: true,
  });

  assert.equal(result.result.responseMode, "PROPOSAL");
  assert.equal(result.result.validChangeCount, 4);
  assert.equal(
    result.changes.some((change) => change.type === "ADD_DAY"),
    false,
  );
  assert.equal(result.costPreview.verifiedTotalDelta, 2500);
  assert.equal(result.costPreview.unknownCostChangeCount, 1);

  const unnecessaryDay = validateAiTripResponse({
    rawRecommendations: [],
    rawChanges: [
      {
        type: "ADD_DAY",
        dayRef: "new_day_1",
        label: "Add Day 6",
        reason: "Extend again.",
        data: {},
      },
    ],
    context: goaContext,
    proposalExpected: true,
  });
  assert.equal(unnecessaryDay.result.validChangeCount, 0);
  assert.match(
    unnecessaryDay.result.rejectionReasons[0] ?? "",
    /existing blank final day/i,
  );
});

test("failed proposal copy stays concise and leaves ideas to the collapsed UI", () => {
  const validation = validateAiTripResponse({
    rawRecommendations: [
      {
        provenance: "EXISTING_OPTION",
        category: "MEAL",
        itemId: "meal-upre",
        dayId: day3,
        title: "Dinner at Upre by 1559 AD",
        reason: "Use the saved dinner.",
      },
    ],
    rawChanges: [
      {
        type: "ADD_MEAL",
        dayId: day3,
        label: "Broken",
        reason: "Missing data.",
        data: {},
      },
    ],
    context,
    proposalExpected: true,
  });
  const message = buildTruthfulAssistantMessage({
    modelMessage: "I prepared it.",
    validation,
    context,
  });

  assert.match(message, /Nothing has been applied/);
  assert.match(message, /Ideas considered/);
  assert.doesNotMatch(message, /Dinner at Upre|Invalid input|schema/i);
});

test("cost-changing selected-item fields get deterministic previews", () => {
  const costContext = structuredClone(context) as TripChatContext;
  costContext.tripOverview.travellers = 3;
  const transport = costContext.selectedItinerary.days
    .flatMap((day) => day.transports)
    .find((candidate) => candidate.id === "transport-train");
  assert.ok(transport);
  Object.assign(transport, {
    costType: "TOTAL",
    pricePerPerson: 1200,
    totalCost: 3000,
    calculatedTripCost: 3000,
  });

  const transportUpdate = validateAiTripResponse({
    rawRecommendations: [],
    rawChanges: [
      {
        type: "UPDATE_TRANSPORT",
        transportId: "transport-train",
        label: "Use per-person transport pricing",
        reason: "Keep the preview aligned with stored cost semantics.",
        data: { costType: "PER_PERSON" },
      },
    ],
    context: costContext,
    proposalExpected: true,
  });

  assert.equal(transportUpdate.costPreview.changes[0]?.beforeCost, 3000);
  assert.equal(transportUpdate.costPreview.changes[0]?.afterCost, 3600);
  assert.equal(transportUpdate.costPreview.changes[0]?.delta, 600);

  const stay = costContext.selectedItinerary.days
    .flatMap((day) => day.stays)
    .find((candidate) => candidate.id === "stay-fixed");
  assert.ok(stay);
  Object.assign(stay, {
    pricePerNight: 2000,
    nights: 2,
    totalCost: 0,
    calculatedTripCost: 4000,
  });

  const stayUpdate = validateAiTripResponse({
    rawRecommendations: [],
    rawChanges: [
      {
        type: "UPDATE_STAY",
        stayId: "stay-fixed",
        label: "Extend the stay",
        reason: "Cover the added night.",
        data: { nights: 3 },
      },
    ],
    context: costContext,
    proposalExpected: true,
  });

  assert.equal(stayUpdate.costPreview.changes[0]?.beforeCost, 4000);
  assert.equal(stayUpdate.costPreview.changes[0]?.afterCost, 6000);
  assert.equal(stayUpdate.costPreview.changes[0]?.delta, 2000);
});

test("stored version-2 and legacy proposal payloads remain readable", () => {
  const validation = validateAiTripResponse({
    rawRecommendations: [],
    rawChanges: [
      select(
        "SELECT_TRANSPORT_OPTION",
        "transport-cab",
        day4,
        "transport-train",
      ),
    ],
    context,
    proposalExpected: true,
  });
  const version2 = createStoredTripChatPayload(validation);
  const parsedVersion2 = parseStoredTripChatPayload(version2);
  assert.equal(parsedVersion2?.version, 2);
  assert.equal(parsedVersion2?.changes.length, 1);

  const parsedLegacy = parseStoredTripChatPayload(version2.changes);
  assert.equal(parsedLegacy?.version, 2);
  assert.equal(parsedLegacy?.result.proposalCreated, true);
  assert.equal(parsedLegacy?.changes[0]?.type, "SELECT_TRANSPORT_OPTION");
});

