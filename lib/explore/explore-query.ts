export const PAGE_SIZE = 12;

export const durationOptions = [
  { label: "1-3 days", value: "1-3", min: 1, max: 3 },
  { label: "4-7 days", value: "4-7", min: 4, max: 7 },
  { label: "8-14 days", value: "8-14", min: 8, max: 14 },
  { label: "15+ days", value: "15-plus", min: 15, max: null },
] as const;

export const budgetOptions = [
  { label: "Budget", value: "budget" },
  { label: "Mid-range", value: "mid-range" },
  { label: "Luxury", value: "luxury" },
] as const;

export const travelStyleOptions = [
  { label: "Solo", value: "solo" },
  { label: "Couple", value: "couple" },
  { label: "Family", value: "family" },
  { label: "Friends", value: "friends" },
  { label: "Adventure", value: "adventure" },
  { label: "Relaxing", value: "relaxing" },
] as const;

export const sortOptions = [
  { label: "Recent", value: "recent" },
  { label: "Popular", value: "popular" },
  { label: "Most used as template", value: "most-used" },
  { label: "Shortest duration", value: "shortest" },
  { label: "Longest duration", value: "longest" },
] as const;

export type ExploreDuration = (typeof durationOptions)[number]["value"];
export type ExploreSort = (typeof sortOptions)[number]["value"];

export type ExploreQuery = {
  search: string;
  destination: string;
  duration: ExploreDuration | "";
  budget: string;
  style: string;
  tag: string;
  sort: ExploreSort;
  page: number;
};

type RawSearchParams = Record<string, string | string[] | undefined>;

function getParam(params: RawSearchParams, key: string) {
  const value = params[key];

  if (Array.isArray(value)) return value[0] ?? "";

  return value ?? "";
}

function isDuration(value: string): value is ExploreDuration {
  return durationOptions.some((option) => option.value === value);
}

function isSort(value: string): value is ExploreSort {
  return sortOptions.some((option) => option.value === value);
}

export function parseExploreQuery(params: RawSearchParams): ExploreQuery {
  const rawPage = Number(getParam(params, "page"));
  const duration = getParam(params, "duration");
  const sort = getParam(params, "sort");

  return {
    search: getParam(params, "search").trim(),
    destination: getParam(params, "destination").trim(),
    duration: isDuration(duration) ? duration : "",
    budget: getParam(params, "budget").trim().toLowerCase(),
    style: getParam(params, "style").trim().toLowerCase(),
    tag: getParam(params, "tag").trim().toLowerCase(),
    sort: isSort(sort) ? sort : "recent",
    page: Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1,
  };
}

export function buildExploreHref(
  query: ExploreQuery,
  updates: Partial<Record<keyof ExploreQuery, string | number | null>>,
) {
  const params = new URLSearchParams();
  const nextQuery = { ...query, ...updates };

  Object.entries(nextQuery).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    if (key === "page" && Number(value) <= 1) return;
    params.set(key, String(value));
  });

  const queryString = params.toString();

  return queryString ? `/explore?${queryString}` : "/explore";
}

export function hasActiveExploreFilters(query: ExploreQuery) {
  return Boolean(
    query.search ||
    query.destination ||
    query.duration ||
    query.budget ||
    query.style ||
    query.tag,
  );
}
