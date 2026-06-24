import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import PublicTripDetail from "@/components/explore/PublicTripDetail";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { absoluteUrl, siteConfig } from "@/lib/site";

type ExploreTripDetailPageProps = {
  params: Promise<{ tripId: string }>;
};

function truncateDescription(value: string, maxLength = 155) {
  const compact = value.replace(/\s+/g, " ").trim();

  if (compact.length <= maxLength) return compact;

  return `${compact.slice(0, maxLength - 1).trim()}…`;
}

async function getPublicTripMetadata(tripId: string) {
  return prisma.trip.findFirst({
    where: {
      id: tripId,
      isPublic: true,
    },
    select: {
      id: true,
      title: true,
      summary: true,
      publicTitle: true,
      publicDescription: true,
      coverImageUrl: true,
      destination: true,
    },
  });
}

export async function generateMetadata({ params }: ExploreTripDetailPageProps): Promise<Metadata> {
  const { tripId } = await params;
  const trip = await getPublicTripMetadata(tripId);

  if (!trip) {
    return {
      title: "Trip Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${trip.publicTitle || trip.title} - Kartografer`;
  const description = truncateDescription(
    trip.publicDescription ||
      trip.summary ||
      "View this public trip itinerary on Kartografer, including day-wise activities, transport, stays, meals, notes, and estimated costs."
  );
  const canonicalPath = `/explore/${trip.id}`;
  const image = trip.coverImageUrl || absoluteUrl(siteConfig.ogImage);

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl(canonicalPath),
    },
    openGraph: {
      type: "article",
      siteName: siteConfig.name,
      title,
      description,
      url: absoluteUrl(canonicalPath),
      images: [
        {
          url: image,
          alt: `${trip.publicTitle || trip.title} cover image`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ExploreTripDetailPage({ params }: ExploreTripDetailPageProps) {
  const { tripId } = await params;
  const session = await getServerSession(authOptions);

  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      isPublic: true,
    },
    select: {
      id: true,
      title: true,
      summary: true,
      publicTitle: true,
      publicDescription: true,
      coverImageUrl: true,
      destination: true,
      durationDays: true,
      budgetStyle: true,
      travelStyle: true,
      tags: true,
      copiedCount: true,
      publishedAt: true,
      daysCount: true,
      peopleCount: true,
      budgetAmount: true,
      fromPlace: { select: { name: true, formattedName: true } },
      toPlace: { select: { name: true, formattedName: true } },
      costBreakdown: {
        select: {
          totalEstimatedCost: true,
          transportCost: true,
          stayCost: true,
          foodCost: true,
          activityCost: true,
          budgetStatus: true,
        },
      },
      days: {
        orderBy: { dayNumber: "asc" },
        select: {
          id: true,
          dayNumber: true,
          title: true,
          description: true,
          notes: true,
          estimatedCost: true,
          transportOptions: {
            where: { isSelected: true },
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              title: true,
              mode: true,
              fromText: true,
              toText: true,
              description: true,
              totalCost: true,
              pricePerPerson: true,
            },
          },
          stayOptions: {
            where: { isSelected: true },
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              name: true,
              city: true,
              area: true,
              budgetLevel: true,
              totalCost: true,
              pricePerNight: true,
              nights: true,
            },
          },
          mealSuggestions: {
            where: { isSelected: true },
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              mealType: true,
              title: true,
              locationName: true,
              estimatedCost: true,
            },
          },
          activities: {
            where: { isSelected: true },
            orderBy: [{ position: "asc" }, { createdAt: "asc" }],
            select: {
              id: true,
              title: true,
              description: true,
              locationName: true,
              category: true,
              startTime: true,
              endTime: true,
              estimatedCost: true,
            },
          },
        },
      },
    },
  });

  if (!trip) {
    notFound();
  }

  const title = trip.publicTitle || trip.title;

  return (
    <>
      <PublicTripDetail trip={trip} isLoggedIn={Boolean(session?.user?.id)} />
    </>
  );
}