export const demoPrompt =
  "Plan a 15-day budget Ladakh and Kashmir trip from Ahmedabad, with vegetarian food, shared transport, and a budget under ₹70,000.";

export const tripConstraints = [
  { label: "Route", value: "Ladakh + Kashmir" },
  { label: "Duration", value: "15 days" },
  { label: "Budget", value: "₹70,000" },
  { label: "Food", value: "Vegetarian" },
  { label: "Transport", value: "Shared" },
  { label: "Pace", value: "Balanced" },
] as const;

export const routeStops = [
  { day: "01", city: "Ahmedabad", short: "AMD", x: 7, y: 78 },
  { day: "02", city: "Delhi", short: "DEL", x: 23, y: 62 },
  { day: "03", city: "Manali", short: "MNL", x: 38, y: 50 },
  { day: "04", city: "Leh", short: "LEH", x: 52, y: 31 },
  { day: "06", city: "Nubra", short: "NBR", x: 66, y: 18 },
  { day: "08", city: "Pangong", short: "PNG", x: 79, y: 35 },
  { day: "10", city: "Hanle", short: "HNL", x: 88, y: 52 },
  { day: "14", city: "Srinagar", short: "SXR", x: 62, y: 70 },
] as const;

export const itineraryDays = [
  {
    day: "Day 1",
    title: "Ahmedabad to Delhi",
    note: "Overnight rail connection",
    tone: "route",
  },
  {
    day: "Day 2",
    title: "Delhi to Manali",
    note: "Shared Volvo bus",
    tone: "route",
  },
  {
    day: "Day 4",
    title: "Leh acclimatisation",
    note: "Old town and quiet evening",
    tone: "stay",
  },
  {
    day: "Day 6",
    title: "Nubra Valley",
    note: "Shared taxi via Khardung La",
    tone: "activity",
  },
  {
    day: "Day 8",
    title: "Pangong Lake",
    note: "Lakeside stay and viewpoint",
    tone: "stay",
  },
] as const;

export const optionItems = [
  {
    id: "transport",
    type: "Transport",
    title: "Shared taxi to Nubra",
    detail: "₹2,200 per person",
  },
  {
    id: "stay",
    type: "Stay",
    title: "Old Leh homestay",
    detail: "₹1,400 per night",
  },
  {
    id: "meal",
    type: "Meal",
    title: "Vegetarian Ladakhi thali",
    detail: "₹260 estimated",
  },
  {
    id: "hidden",
    type: "Hidden spot",
    title: "Pangong ridge viewpoint",
    detail: "Free · sunrise",
  },
] as const;

export const budgetItems = [
  { label: "Transport", value: 18500, percent: 33 },
  { label: "Stays", value: 22000, percent: 39 },
  { label: "Food", value: 9500, percent: 17 },
  { label: "Activities", value: 6000, percent: 11 },
] as const;

export const templates = [
  {
    title: "15-Day Ladakh Budget Adventure",
    image: "/landing/templates/ladakh.jpg",
    route: "Ahmedabad → Leh → Nubra → Pangong",
    days: "15 days",
    budget: "₹70k",
    style: "Budget adventure",
  },
  {
    title: "7-Day Sikkim Solo Plan",
    image: "/landing/templates/sikkim.jpg",
    route: "Gangtok → Lachung → Pelling",
    days: "7 days",
    budget: "₹30k",
    style: "Solo · shared taxis",
  },
  {
    title: "5-Day Himachal Escape",
    image: "/landing/templates/himachal.jpg",
    route: "Delhi → Manali → Solang",
    days: "5 days",
    budget: "₹22k",
    style: "Backpacking",
  },
  {
    title: "10-Day Rajasthan Culture Route",
    image: "/landing/templates/rajasthan.jpg",
    route: "Jaipur → Jodhpur → Udaipur",
    days: "10 days",
    budget: "₹45k",
    style: "Heritage · rail",
  },
] as const;
