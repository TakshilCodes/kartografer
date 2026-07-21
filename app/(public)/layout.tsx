import type { Metadata } from "next";

import Navbar from "@/components/shared/Navbar";

export const metadata: Metadata = {
  title: "Kartografer - AI Travel Planner",
  description:
    "Turn a rough travel idea into an editable Kartografer workspace with routes, stays, meals, activities, hidden spots, budgets, templates, and PDF-ready itineraries.",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}
