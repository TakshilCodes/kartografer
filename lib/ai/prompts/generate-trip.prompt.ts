type GenerateTripPromptInput = {
  fromPlace: string;
  toPlace: string;
  daysCount: number;
  peopleCount: number;
  budgetAmount: number | null;
  currency: string;
  tripType: string;
  travelPace: string;
  foodPreference: string;
  transportPreference: string;
  specialNotes?: string | null;
};

function formatBudget(amount: number | null, currency: string) {
  if (!amount || amount <= 0) {
    return "Not specified";
  }

  return `${currency} ${amount}`;
}

export function buildGenerateTripPrompt(input: GenerateTripPromptInput) {
  const budget = formatBudget(input.budgetAmount, input.currency);

  return `
You are an expert India travel planner for Kartografer, an AI travel planning app.

Your task:
Create a complete ${input.daysCount}-day trip plan from ${input.fromPlace} to ${input.toPlace}.

Trip details:
- Starting place: ${input.fromPlace}
- Destination: ${input.toPlace}
- Number of days: ${input.daysCount}
- Number of people: ${input.peopleCount}
- Budget: ${budget}
- Currency: ${input.currency}
- Trip type: ${input.tripType}
- Travel pace: ${input.travelPace}
- Food preference: ${input.foodPreference}
- Transport preference: ${input.transportPreference}
- Special notes: ${input.specialNotes?.trim() || "None"}

Very important product behavior:
- The trip must contain both selected final itinerary items and alternative options.
- selected = default final trip plan shown in the Itinerary Editor.
- options = extra suggestions shown in the Options Panel.
- selected items will be saved with isSelected: true.
- options items will be saved with isSelected: false.

Return ONLY valid JSON.
Do not include markdown.
Do not wrap the response in \`\`\`json.
Do not include explanations before or after the JSON.

Required JSON shape:

{
  "title": "string",
  "summary": "string",
  "days": [
    {
      "dayNumber": 1,
      "title": "string",
      "description": "string",
      "notes": "string",
      "selected": {
        "transports": [
          {
            "title": "string",
            "mode": "FLIGHT | TRAIN | BUS | CAB | SELF_DRIVE | WALK | BIKE | FERRY | METRO | MIXED | OTHER",
            "fromText": "string or null",
            "toText": "string or null",
            "description": "string or null",
            "costType": "PER_PERSON | TOTAL",
            "pricePerPerson": 0,
            "totalCost": 0,
            "notes": "string or null"
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
            "bestFor": "string or null",
            "notes": "string or null"
          }
        ],
        "meals": [
          {
            "mealType": "BREAKFAST | LUNCH | DINNER | SNACK | OTHER",
            "title": "string",
            "locationName": "string or null",
            "estimatedCost": 0,
            "notes": "string or null"
          }
        ],
        "activities": [
          {
            "title": "string",
            "description": "string or null",
            "locationName": "string or null",
            "address": "string or null",
            "startTime": "HH:mm or null",
            "endTime": "HH:mm or null",
            "durationMinutes": 0,
            "category": "SIGHTSEEING | ADVENTURE | FOOD | SHOPPING | RELAXATION | CULTURE | RELIGIOUS | NATURE | TRANSPORT_BREAK | HIDDEN_SPOT | OTHER",
            "estimatedCost": 0,
            "notes": "string or null",
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
1. Generate exactly ${input.daysCount} days.
2. dayNumber must start from 1 and increase in order.
3. Keep the trip realistic for Indian travel.
4. Respect the user's budget if provided.
5. Respect the user's food preference.
6. Respect the user's transport preference when possible.
7. Respect the travel pace:
   - RELAXED = fewer activities, more rest time.
   - BALANCED = practical day plan.
   - FAST = more activities per day.
8. Include realistic estimated costs in ${input.currency}.
9. For transport:
   - Use PER_PERSON when cost depends on people, like flight/train/bus.
   - Use TOTAL when cost is for the group, like cab/self-drive.
10. For stays:
   - Include either totalCost or pricePerNight + nights.
   - nights should usually be 1 for one day unless the stay clearly covers more.
11. For meals:
   - Include breakfast, lunch, and dinner where useful.
   - Keep food preference in mind.
12. For activities:
   - Use HIDDEN_SPOT category for hidden/offbeat places.
   - Use FOOD category for food-related experiences.
   - Use TRANSPORT_BREAK for rest stops or travel breaks.
13. selected should contain the best default plan.
14. options should contain useful alternatives, not duplicates of selected items.
15. Every day should have at least some selected meals or activities.
16. Options can be fewer than selected items, but every trip should include some useful options overall.
17. Use null when a field is unknown.
18. Do not invent impossible travel times.
19. Do not include unsafe or illegal suggestions.
20. Return only JSON.
`;
}

export type { GenerateTripPromptInput };