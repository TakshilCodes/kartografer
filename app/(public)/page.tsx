import type { Metadata } from "next";

import LandingPage from "@/components/landing/LandingPage";
// import JsonLd from "@/components/seo/JsonLd";
import { absoluteUrl, siteConfig } from "@/lib/site";
import "@/components/landing/landing.css";

export const metadata: Metadata = {
  title: "Kartografer - AI Travel Planner for Detailed Trip Itineraries",
  description:
    "Create personalized travel itineraries with AI. Plan places, stays, transport, meals, activities, hidden spots, and estimated costs in one place.",
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    title: "Kartografer - AI Travel Planner for Detailed Trip Itineraries",
    description:
      "Create personalized travel itineraries with AI. Plan places, stays, transport, meals, activities, hidden spots, and estimated costs in one place.",
    url: absoluteUrl("/"),
    images: [absoluteUrl(siteConfig.ogImage)],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kartografer - AI Travel Planner for Detailed Trip Itineraries",
    description:
      "Create personalized travel itineraries with AI. Plan places, stays, transport, meals, activities, hidden spots, and estimated costs in one place.",
    images: [absoluteUrl(siteConfig.ogImage)],
  },
};

export default function Home() {
  return (
    <>
      <LandingPage />
    </>
  );
}