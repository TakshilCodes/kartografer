import type { GenerateTripInput } from "@/lib/ai/ai-client";

type GenerateTripDaysChunkPromptInput = GenerateTripInput & {
  startDay: number;
  endDay: number;
};

function formatBudget(amount: number | null, currency: string) {
  if (!amount || amount <= 0) {
    return "Not specified";
  }

  return `${currency} ${amount}`;
}

export function buildGenerateTripDaysChunkPrompt(
  input: GenerateTripDaysChunkPromptInput
) {
  const budget = formatBudget(input.budgetAmount, input.currency);
  const daysInChunk = input.endDay - input.startDay + 1;

  return `
You are an expert India travel planner for Kartografer, an AI travel planning app.

Your task:
Generate ONLY days ${input.startDay} to ${input.endDay} for a ${input.daysCount}-day trip from ${input.fromPlace} to ${input.toPlace}.

Trip details:
- Starting place: ${input.fromPlace}
- Destination: ${input.toPlace}
- Full trip length: ${input.daysCount} days
- Requested day range: ${input.startDay}-${input.endDay}
- Number of requested days: ${daysInChunk}
- Number of people: ${input.peopleCount}
- Budget: ${budget}
- Currency: ${input.currency}
- Trip type: ${input.tripType}
- Travel pace: ${input.travelPace}
- Food preference: ${input.foodPreference}
- Transport preference: ${input.transportPreference}
- Special notes: ${input.specialNotes?.trim() || "None"}

Return ONLY valid JSON.
Do not include markdown.
Do not wrap the response in \`\`\`json.
Do not include explanations before or after the JSON.
Do not generate days outside ${input.startDay}-${input.endDay}.

Enum rule:
- Fields shown as "A | B | C" mean choose exactly one token from that list.
- Return the token only, for example "HOTEL", not "Hotel", "hotel", "luxury hotel", or "HOTEL | RESORT".
- Do this for mode, costType, stayType, budgetLevel, mealType, and category.

Required JSON shape:

{
  "days": [
    {
      "dayNumber": ${input.startDay},
      "title": "short day title",
      "description": "1 short sentence",
      "notes": "short note or null",
      "selected": {
        "transports": [
          {
            "title": "string",
            "mode": "FLIGHT | TRAIN | BUS | CAB | SELF_DRIVE | WALK | BIKE | FERRY | METRO | MIXED | OTHER",
            "fromText": "string or null",
            "toText": "string or null",
            "description": "short string or null",
            "costType": "PER_PERSON | TOTAL",
            "pricePerPerson": 0,
            "totalCost": 0,
            "notes": "short string or null"
          }
        ],
        "stays": [
          {
            "name": "string",
            "city": "string or null",
            "area": "string or null",
            "stayType": "HOTEL | RESORT | HOMESTAY | HOUSEBOAT | HOSTEL | VILLA | CAMP | GUEST_HOUSE | OTHER",
            "budgetLevel": "BUDGET | MID_RANGE | PREMIUM | LUXURY",
            "pricePerNight": 0,
            "nights": 1,
            "totalCost": 0,
            "bestFor": "short string or null",
            "notes": "short string or null"
          }
        ],
        "meals": [
          {
            "mealType": "BREAKFAST | LUNCH | DINNER | SNACK | OTHER",
            "title": "string",
            "locationName": "string or null",
            "estimatedCost": 0,
            "notes": "short string or null"
          }
        ],
        "activities": [
          {
            "title": "string",
            "description": "short string or null",
            "locationName": "string or null",
            "address": "string or null",
            "startTime": "HH:mm or null",
            "endTime": "HH:mm or null",
            "durationMinutes": 0,
            "category": "SIGHTSEEING | ADVENTURE | FOOD | SHOPPING | RELAXATION | CULTURE | RELIGIOUS | NATURE | TRANSPORT_BREAK | HIDDEN_SPOT | OTHER",
            "estimatedCost": 0,
            "notes": "short string or null",
            "position": 0
          }
        ]
      },
      "options": {
        "transports": [],
        "stays": [],
        "meals": [],
        "activities": []
      }
    }
  ]
}

Rules:
1. Generate exactly ${daysInChunk} days.
2. Day numbers must start at ${input.startDay} and end at ${input.endDay}.
3. Do not skip any day number.
4. Do not include title or summary at the top level.
5. Keep descriptions short to avoid large responses.
6. Include both selected and options for every day.
7. selected should contain the best default plan.
8. options should contain alternatives, not duplicates.
9. For each day, use at most:
   - 1 selected transport on travel-heavy days.
   - 1 selected stay.
   - 2 selected meals.
   - 2 to 3 selected activities.
   - 1 option item per category.
10. Every day should have at least some selected meals or activities.
11. Use HIDDEN_SPOT category for hidden/offbeat places.
12. Use FOOD category for food-related experiences.
13. Use TRANSPORT_BREAK for rest stops or travel breaks.
14. Respect the travel pace, food preference, transport preference, and budget.
15. Include realistic estimated costs in ${input.currency}.
16. Use null when a field is unknown.
17. Do not invent impossible travel times.
18. Do not include unsafe or illegal suggestions.
19. Return only JSON.
`;
}

export type { GenerateTripDaysChunkPromptInput };
