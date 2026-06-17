type TripChatPromptMessage = {
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
};

type TripChatPromptDay = {
  dayNumber: number;
  title: string;
  description: string | null;
  estimatedCost: string | null;
  transports: string[];
  stays: string[];
  meals: string[];
  activities: string[];
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

function formatList(items: string[]) {
  if (items.length === 0) return "None selected";

  return items.slice(0, 5).join("; ");
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
        day.description ? `Description: ${day.description}` : null,
        `Estimated cost: ${day.estimatedCost ?? "Not set"}`,
        `Selected transport: ${formatList(day.transports)}`,
        `Selected stays: ${formatList(day.stays)}`,
        `Selected meals: ${formatList(day.meals)}`,
        `Selected activities: ${formatList(day.activities)}`,
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

Important Step 17 rules:
- You are only chatting and suggesting changes.
- You must NOT claim that you changed, edited, updated, moved, deleted, or applied anything.
- You cannot directly modify the itinerary or database in this step.
- If the user asks you to make a change, explain what you would suggest changing.
- Mention that changes can be applied later when the preview/apply feature is available.
- Do not return JSON.
- Do not include markdown tables.

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

Answer as Kartografer AI Assistant in 2 to 5 short paragraphs or bullets.
`;
}

export type {
  BuildTripChatPromptInput,
  TripChatPromptDay,
  TripChatPromptMessage,
  TripChatPromptTrip,
};
