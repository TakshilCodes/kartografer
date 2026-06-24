export const siteConfig = {
  name: "Kartografer",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://kartografer.com",
  description:
    "Kartografer is an AI travel planner that helps users create, edit, and explore detailed trip itineraries.",
  defaultTitle: "Kartografer - AI Travel Planner",
  ogImage: "/landing/edit-page-desktop.png",
  keywords: [
    "AI travel planner",
    "itinerary planner",
    "trip planner",
    "travel itinerary generator",
    "AI itinerary builder",
    "India travel planner",
    "vacation planner",
    "travel planning app",
  ],
};

export function absoluteUrl(path = "/") {
  const baseUrl = siteConfig.url.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}