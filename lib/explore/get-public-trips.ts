import type { Prisma } from "@prisma/client";

import prisma from "@/lib/prisma";
import {
  durationOptions,
  type ExploreQuery,
  PAGE_SIZE,
} from "@/lib/explore/explore-query";

function getDurationFilter(duration: ExploreQuery["duration"]) {
  if (!duration) return null;

  const option = durationOptions.find((item) => item.value === duration);

  if (!option) return null;

  if (option.max === null) {
    return { gte: option.min };
  }

  return { gte: option.min, lte: option.max };
}

function getOrderBy(sort: ExploreQuery["sort"]): Prisma.TripOrderByWithRelationInput[] {
  switch (sort) {
    case "popular":
      return [{ copiedCount: "desc" }, { publishedAt: "desc" }];
    case "most-used":
      return [{ copiedCount: "desc" }, { publishedAt: "desc" }];
    case "shortest":
      return [{ durationDays: "asc" }, { daysCount: "asc" }, { publishedAt: "desc" }];
    case "longest":
      return [{ durationDays: "desc" }, { daysCount: "desc" }, { publishedAt: "desc" }];
    default:
      return [{ publishedAt: "desc" }, { createdAt: "desc" }];
  }
}

export async function getPublicTrips({
  query,
  pageSize = PAGE_SIZE,
}: {
  query: ExploreQuery;
  pageSize?: number;
}) {
  const durationFilter = getDurationFilter(query.duration);
  const andFilters: Prisma.TripWhereInput[] = [];

  if (query.search) {
    andFilters.push({
      OR: [
        { publicTitle: { contains: query.search, mode: "insensitive" } },
        { title: { contains: query.search, mode: "insensitive" } },
        { destination: { contains: query.search, mode: "insensitive" } },
        { publicDescription: { contains: query.search, mode: "insensitive" } },
        { summary: { contains: query.search, mode: "insensitive" } },
        { tags: { has: query.search.toLowerCase() } },
      ],
    });
  }

  if (query.destination) {
    andFilters.push({
      destination: { contains: query.destination, mode: "insensitive" },
    });
  }

  if (durationFilter) {
    andFilters.push({
      OR: [{ durationDays: durationFilter }, { daysCount: durationFilter }],
    });
  }

  if (query.budget) {
    andFilters.push({ budgetStyle: query.budget });
  }

  if (query.style) {
    andFilters.push({ travelStyle: query.style });
  }

  if (query.tag) {
    andFilters.push({ tags: { has: query.tag } });
  }

  const where: Prisma.TripWhereInput = {
    isPublic: true,
    publishedAt: { not: null },
    publicSnapshotUpdatedAt: { not: null },
    ...(andFilters.length > 0 ? { AND: andFilters } : {}),
  };

  const totalCount = await prisma.trip.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(query.page, totalPages);

  const trips = await prisma.trip.findMany({
    where,
    orderBy: getOrderBy(query.sort),
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      title: true,
      summary: true,
      publicTitle: true,
      publicDescription: true,
      coverImageUrl: true,
      destination: true,
      durationDays: true,
      daysCount: true,
      peopleCount: true,
      budgetStyle: true,
      travelStyle: true,
      tags: true,
      copiedCount: true,
      publishedAt: true,
      toPlace: { select: { name: true, formattedName: true } },
    },
  });

  return {
    trips: trips.map((trip) => ({
      ...trip,
      publishedAt: trip.publishedAt?.toISOString() ?? null,
    })),
    totalCount,
    totalPages,
    currentPage,
  };
}
