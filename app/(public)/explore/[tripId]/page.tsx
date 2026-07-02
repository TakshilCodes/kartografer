import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PublicTripDetail from "@/components/explore/PublicTripDetail";
import JsonLd from "@/components/seo/JsonLd";
import prisma from "@/lib/prisma";
import { absoluteUrl, siteConfig } from "@/lib/site";
import { readPublicTripSnapshot } from "@/lib/explore/public-trip-snapshot";

export const revalidate = 300;

type ExploreTripDetailPageProps = {
  params: Promise<{ tripId: string }>;
};

function truncateDescription(value: string, maxLength = 155) {
  const compact = value.replace(/\s+/g, " ").trim();

  if (compact.length <= maxLength) return compact;

  return `${compact.slice(0, maxLength - 1).trim()}...`;
}

async function getPublicTripMetadata(tripId: string) {
  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      isPublic: true,
      publicSnapshotUpdatedAt: { not: null },
    },
    select: {
      id: true,
      publicSnapshotJson: true,
      coverImageUrl: true,
      publicTitle: true,
      publicDescription: true,
      title: true,
      summary: true,
    },
  });

  if (!trip) return null;

  const snapshot = readPublicTripSnapshot(trip.publicSnapshotJson);

  if (!snapshot) return null;

  return {
    id: trip.id,
    title: snapshot.publicTitle || trip.publicTitle || snapshot.title || trip.title,
    description:
      snapshot.publicDescription ||
      trip.publicDescription ||
      snapshot.summary ||
      trip.summary ||
      "View this public trip itinerary on Kartografer, including day-wise activities, transport, stays, meals, notes, and estimated costs.",
    image: snapshot.coverImageUrl || trip.coverImageUrl,
  };
}

export async function generateMetadata({
  params,
}: ExploreTripDetailPageProps): Promise<Metadata> {
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

  const title = `${trip.title} - Kartografer`;
  const description = truncateDescription(trip.description);
  const canonicalPath = `/explore/${trip.id}`;
  const image = trip.image || absoluteUrl(siteConfig.ogImage);

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
          alt: `${trip.title} cover image`,
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

export default async function ExploreTripDetailPage({
  params,
}: ExploreTripDetailPageProps) {
  const { tripId } = await params;

  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      isPublic: true,
      publicSnapshotUpdatedAt: { not: null },
    },
    select: {
      id: true,
      copiedCount: true,
      publishedAt: true,
      publicSnapshotJson: true,
    },
  });

  if (!trip) {
    notFound();
  }

  const snapshot = readPublicTripSnapshot(trip.publicSnapshotJson);

  if (!snapshot) {
    notFound();
  }

  const publicTrip = {
    ...snapshot,
    id: trip.id,
    copiedCount: trip.copiedCount,
    publishedAt: trip.publishedAt,
  };
  const title = publicTrip.publicTitle || publicTrip.title;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: absoluteUrl("/"),
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Explore",
              item: absoluteUrl("/explore"),
            },
            {
              "@type": "ListItem",
              position: 3,
              name: title,
              item: absoluteUrl(`/explore/${trip.id}`),
            },
          ],
        }}
      />
      <PublicTripDetail
        trip={publicTrip}
      />
    </>
  );
}
