type TripChatPromptMessage = {
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
};

type TripChatPromptItem = {
  id: string;
  title: string;
};

type TripChatPromptDay = {
  id: string;
  dayNumber: number;
  title: string;
  description: string | null;
  estimatedCost: string | null;
  transports: TripChatPromptItem[];
  stays: TripChatPromptItem[];
  meals: TripChatPromptItem[];
  activities: TripChatPromptItem[];
};

type TripChatPromptTrip = {
  title: string;
  summary: string | null;
  daysCount: number;
  peopleCount: number;
  budgetAmount: string | null;
  currency: string;
  tripType: string;
  travelPace: string;
  foodPreference: string;
  transportPreference: string;
  specialNotes: string | null;
  fromPlace: string;
  toPlace: string;
  totalEstimatedCost: string | null;
  budgetStatus: string | null;
  days: TripChatPromptDay[];
};

type BuildTripChatPromptInput = {
  trip: TripChatPromptTrip;
  recentMessages: TripChatPromptMessage[];
  userMessage: string;
};

function formatItems(items: TripChatPromptItem[], idLabel: string) {
  if (items.length === 0) return "None selected";

  return items
    .slice(0, 5)
    .map((item) => `${idLabel}: ${item.id}, title: ${item.title}`)
    .join("; ");
}

function formatRecentMessages(messages: TripChatPromptMessage[]) {
  if (messages.length === 0) return "No previous messages.";

  return messages
    .map((message) => {
      return `${message.role}: ${message.content}`;
    })
    .join("\n");
}

function formatTripDays(days: TripChatPromptDay[]) {
  if (days.length === 0) return "No itinerary days are available yet.";

  return days
    .map((day) => {
      return [
        `Day ${day.dayNumber}: ${day.title}`,
        `dayId: ${day.id}`,
        day.description ? `Description: ${day.description}` : null,
        `Estimated cost: ${day.estimatedCost ?? "Not set"}`,
        `Selected transport: ${formatItems(day.transports, "transportId")}`,
        `Selected stays: ${formatItems(day.stays, "stayId")}`,
        `Selected meals: ${formatItems(day.meals, "mealId")}`,
        `Selected activities: ${formatItems(day.activities, "activityId")}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

export function buildTripChatPrompt({
  trip,
  recentMessages,
  userMessage,
}: BuildTripChatPromptInput) {
  return `
You are Kartografer AI Assistant, a practical travel planning assistant.

Your job:
- Help the user improve the current trip.
- Suggest itinerary changes, cost reductions, hidden spots, food improvements, route improvements, and pacing changes.
- Use the current trip context below.
- Be concise, specific, and useful.

Important rules:
- You are chatting and creating safe previewable proposed changes.
- You must NOT claim that you changed, edited, updated, moved, deleted, or applied anything.
- You cannot directly modify the itinerary or database in this step.
- If the user asks you to make a change, explain what you would suggest changing.
- The user must click Apply before any change happens.

Response rules:
- Return JSON only.
- Do not include markdown.
- Do not wrap the response in code fences.
- The JSON must have "assistantMessage" and "proposedChanges".
- "assistantMessage" is normal text shown to the user.
- "proposedChanges" is an array of structured changes.
- If the user only asks a general question, use an empty proposedChanges array.
- Advice questions such as "Can I make Day 1 cheaper?" or "How can I reduce the trip cost?" may use an empty proposedChanges array and should receive a useful normal answer.
- Requests directed at you, such as "Make Day 1 cheaper" or "Can you update this activity?", should include valid proposed changes when matching items exist.
- If the user asks to make, update, add, remove, replace, include, move, reduce, or improve itinerary content, proposedChanges must contain at least one valid change when a matching day/item exists.
- Use only IDs that appear in the trip context below.
- Do not invent IDs.
- Create small safe changes only.
- Prefer add/update over delete.
- Do not delete many things at once.
- Keep proposed changes practical.
- For requests like "make this activity include phase 2", use UPDATE_ACTIVITY on the matching activityId and update title, description, notes, or estimatedCost as needed.
- For requests like "make Day 1 cheaper", prefer ADD_TRANSPORT, ADD_MEAL, UPDATE_ACTIVITY, UPDATE_DAY, or ADD_STAY rather than only giving advice.

Allowed change types:
- ADD_ACTIVITY, UPDATE_ACTIVITY, DELETE_ACTIVITY
- ADD_MEAL, UPDATE_MEAL, DELETE_MEAL
- ADD_TRANSPORT, UPDATE_TRANSPORT, DELETE_TRANSPORT
- ADD_STAY, UPDATE_STAY, DELETE_STAY
- UPDATE_DAY

Required response shape:
{
  "assistantMessage": "Short helpful response for the user.",
  "proposedChanges": [
    {
      "type": "ADD_TRANSPORT",
      "label": "Add shared taxi option for Day 1",
      "reason": "Shared transport can reduce the day cost.",
      "dayId": "existing_day_id_from_context",
      "data": {
        "title": "Shared taxi for local sightseeing",
        "mode": "CAB",
        "fromText": "Hotel",
        "toText": "Local sightseeing area",
        "description": "Use shared taxi or local transport instead of a private cab.",
        "costType": "TOTAL",
        "totalCost": 1200,
        "notes": "Cheaper alternative suggested by AI."
      }
    }
  ]
}

ID rules:
- ADD_* changes require dayId.
- UPDATE_DAY requires dayId.
- UPDATE_ACTIVITY and DELETE_ACTIVITY require activityId.
- UPDATE_MEAL and DELETE_MEAL require mealId.
- UPDATE_TRANSPORT and DELETE_TRANSPORT require transportId.
- UPDATE_STAY and DELETE_STAY require stayId.
- For update/delete, use only IDs listed in selected itinerary items below.

Enum rules:
- mode: FLIGHT, TRAIN, BUS, CAB, SELF_DRIVE, WALK, BIKE, FERRY, METRO, MIXED, OTHER
- costType: PER_PERSON, TOTAL
- stayType: HOTEL, RESORT, HOMESTAY, HOUSEBOAT, HOSTEL, VILLA, CAMP, GUEST_HOUSE, OTHER
- budgetLevel: BUDGET, MID_RANGE, PREMIUM, LUXURY
- mealType: BREAKFAST, LUNCH, DINNER, SNACK, OTHER
- category: SIGHTSEEING, ADVENTURE, FOOD, SHOPPING, RELAXATION, CULTURE, RELIGIOUS, NATURE, TRANSPORT_BREAK, HIDDEN_SPOT, OTHER

Trip overview:
Title: ${trip.title}
Summary: ${trip.summary ?? "Not set"}
Route: ${trip.fromPlace} to ${trip.toPlace}
Days: ${trip.daysCount}
People: ${trip.peopleCount}
Budget: ${trip.budgetAmount ? `${trip.currency} ${trip.budgetAmount}` : "Not set"}
Estimated total: ${trip.totalEstimatedCost ? `${trip.currency} ${trip.totalEstimatedCost}` : "Not set"}
Budget status: ${trip.budgetStatus ?? "Unknown"}
Trip type: ${trip.tripType}
Travel pace: ${trip.travelPace}
Food preference: ${trip.foodPreference}
Transport preference: ${trip.transportPreference}
Special notes: ${trip.specialNotes ?? "None"}

Current selected itinerary:
${formatTripDays(trip.days)}

Recent conversation:
${formatRecentMessages(recentMessages)}

User message:
${userMessage}

Return JSON only now.
`;
}

export type {
  BuildTripChatPromptInput,
  TripChatPromptDay,
  TripChatPromptItem,
  TripChatPromptMessage,
  TripChatPromptTrip,
};
