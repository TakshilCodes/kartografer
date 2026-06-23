import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Shared Trip",
    template: "%s | Kartografer Shared Trip",
  },
  description:
    "View a read-only Kartografer itinerary with selected days, routes, stays, meals, activities, hidden spots, and estimated travel costs.",
};

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}