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

function getOrderBy(
  sort: ExploreQuery["sort"],
): Prisma.TripOrderByWithRelationInput[] {
  switch (sort) {
    case "popular":
    case "most-used":
      return [{ copiedCount: "desc" }, { publishedAt: "desc" }];

    case "shortest":
      return [
        { durationDays: "asc" },
        { daysCount: "asc" },
        { publishedAt: "desc" },
      ];

    case "longest":
      return [
        { durationDays: "desc" },
        { daysCount: "desc" },
        { publishedAt: "desc" },
      ];

    default:
      return [{ publishedAt: "desc" }, { createdAt: "desc" }];
  }
}

const publicTripCardSelect = {
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
  toPlace: {
    select: {
      name: true,
      formattedName: true,
    },
  },
} satisfies Prisma.TripSelect;

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
    const search = query.search.trim();

    if (search) {
      andFilters.push({
        OR: [
          { publicTitle: { contains: search, mode: "insensitive" } },
          { title: { contains: search, mode: "insensitive" } },
          { destination: { contains: search, mode: "insensitive" } },
          { publicDescription: { contains: search, mode: "insensitive" } },
          { summary: { contains: search, mode: "insensitive" } },
          { tags: { has: search.toLowerCase() } },
        ],
      });
    }
  }

  if (query.destination) {
    andFilters.push({
      destination: { contains: query.destination.trim(), mode: "insensitive" },
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

  const safePage = Math.max(1, query.page);
  const safePageSize = Math.min(Math.max(1, pageSize), 24);

  const [totalCount, trips] = await prisma.$transaction([
    prisma.trip.count({ where }),
    prisma.trip.findMany({
      where,
      orderBy: getOrderBy(query.sort),
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
      select: publicTripCardSelect,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));
  const currentPage = Math.min(safePage, totalPages);

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