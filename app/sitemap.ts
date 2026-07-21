import type { MetadataRoute } from "next";

import prisma from "@/lib/prisma";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const publicTrips = await prisma.trip.findMany({
    where: { isPublic: true, publicSnapshotUpdatedAt: { not: null } },
    select: {
      id: true,
      publishedAt: true,
      publicSnapshotUpdatedAt: true,
      updatedAt: true,
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
  });

  return [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/explore"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...publicTrips.map((trip) => ({
      url: absoluteUrl(`/explore/${trip.id}`),
      lastModified:
        trip.publicSnapshotUpdatedAt ??
        trip.publishedAt ??
        trip.updatedAt ??
        new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
