import type { Metadata } from "next";
import ExploreFilters from "@/components/explore/ExploreFilters";
import ExplorePagination from "@/components/explore/ExplorePagination";
import ExploreTripsGrid from "@/components/explore/ExploreTripsGrid";
import { getPublicTrips } from "@/lib/explore/get-public-trips";
import {
  hasActiveExploreFilters,
  parseExploreQuery,
  PAGE_SIZE,
} from "@/lib/explore/explore-query";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Explore Public Trip Itineraries",
  description:
    "Discover public travel itineraries created with Kartografer and use them as inspiration for your next trip.",
  alternates: {
    canonical: "/explore",
  },
  openGraph: {
    title: "Explore Public Trip Itineraries - Kartografer",
    description:
      "Discover public travel itineraries created with Kartografer and use them as inspiration for your next trip.",
    url: "/explore",
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Public Trip Itineraries - Kartografer",
    description:
      "Discover public travel itineraries created with Kartografer and use them as inspiration for your next trip.",
  },
};
type ExplorePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const query = parseExploreQuery(resolvedSearchParams);
  const result = await getPublicTrips({ query, pageSize: PAGE_SIZE });
  const hasFilters = hasActiveExploreFilters(query);

  return (
    <div className="min-h-screen bg-background px-3 pb-12 pt-26 sm:px-5 lg:px-6 lg:pt-30">
      <div className="mx-auto max-w-330 space-y-5">
        <header className="px-1 sm:px-2">
          <h1 className="text-4xl font-black tracking-[-0.04em] text-foreground sm:text-5xl lg:text-6xl">
            Explore Trips
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-secondary-foreground sm:text-base">
            Discover public itineraries and use them as a starting point for your own trip.
          </p>
        </header>

        <ExploreFilters query={query} />

        <div className="flex items-center justify-between gap-4 px-1">
          <p className="text-sm font-bold text-secondary-foreground">
            {result.totalCount} {result.totalCount === 1 ? "trip" : "trips"} found
          </p>
          <p className="text-sm font-bold text-secondary-foreground">
            Page {result.currentPage} of {result.totalPages}
          </p>
        </div>

        <ExploreTripsGrid trips={result.trips} hasFilters={hasFilters} />

        <ExplorePagination
          query={query}
          currentPage={result.currentPage}
          totalPages={result.totalPages}
        />
      </div>
    </div>
  );
}