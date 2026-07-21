import type { Metadata } from "next";

import LandingPage from "@/components/landing/LandingPage";
import JsonLd from "@/components/seo/JsonLd";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const dynamic = "force-static";

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
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: siteConfig.name,
            url: absoluteUrl("/"),
            description: siteConfig.description,
          },
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: siteConfig.name,
            applicationCategory: "TravelApplication",
            operatingSystem: "Web",
            url: absoluteUrl("/"),
            description: siteConfig.description,
          },
        ]}
      />

      <LandingPage />
    </>
  );
}
