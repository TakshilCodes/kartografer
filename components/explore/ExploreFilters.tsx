"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";

import { triggerExploreGridLoading } from "@/components/explore/ExploreTripsGrid";
import {
  budgetOptions,
  durationOptions,
  sortOptions,
  travelStyleOptions,
  type ExploreQuery,
  hasActiveExploreFilters,
} from "@/lib/explore/explore-query";

type Option = {
  label: string;
  value: string;
  description?: string;
};

const durationFilterOptions: Option[] = [
  { label: "Any duration", value: "", description: "Show all trip lengths" },
  ...durationOptions.map((option) => ({
    label: option.label,
    value: option.value,
    description:
      option.value === "15-plus"
        ? "Long-form itineraries"
        : "Shortlist by days",
  })),
];

const budgetFilterOptions: Option[] = [
  { label: "Any budget", value: "", description: "No budget filter" },
  ...budgetOptions.map((option) => ({
    ...option,
    description:
      option.value === "budget"
        ? "Lower-cost plans"
        : option.value === "mid-range"
          ? "Balanced comfort"
          : "Premium stays and pacing",
  })),
];

const styleFilterOptions: Option[] = [
  { label: "Any style", value: "", description: "All traveler types" },
  ...travelStyleOptions.map((option) => ({
    ...option,
    description: "Match the trip mood",
  })),
];

const sortFilterOptions: Option[] = sortOptions.map((option) => ({
  ...option,
  description:
    option.value === "recent"
      ? "Newest published first"
      : option.value === "popular"
        ? "Used and recently shared"
        : option.value === "most-used"
          ? "Most copied templates"
          : option.value === "shortest"
            ? "Fewest days first"
            : "Most days first",
}));

export default function ExploreFilters({ query }: { query: ExploreQuery }) {
  const hasFilters = hasActiveExploreFilters(query);

  const [duration, setDuration] = useState<string>(query.duration);
  const [budget, setBudget] = useState<string>(query.budget);
  const [style, setStyle] = useState<string>(query.style);
  const [sort, setSort] = useState<string>(query.sort);

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const filtersRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!filtersRef.current?.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenDropdown(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <form
      ref={filtersRef}
      action="/explore"
      onSubmit={triggerExploreGridLoading}
      className="relative z-40 overflow-visible rounded-[30px] border border-border bg-card/92 p-3 shadow-[0_18px_55px_rgba(81,49,23,0.08)] backdrop-blur sm:p-4"
    >
      <div className="mb-3 flex min-h-9 items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-card-secondary text-primary">
            <SlidersHorizontal className="h-4 w-4" />
          </span>
          <p className="text-sm font-black text-foreground">
            Find an itinerary
          </p>
        </div>

        {hasFilters ? (
          <Link
            href="/explore"
            onClick={triggerExploreGridLoading}
            className="hidden h-9 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-black text-foreground transition hover:bg-card-secondary sm:inline-flex"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Link>
        ) : null}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.9fr)_150px_150px_150px_165px_auto] lg:items-end">
        <label className="block">
          <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-secondary-foreground">
            Search
          </span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <input
              name="search"
              defaultValue={query.search}
              placeholder="Search Kashmir, Ladakh, family..."
              className="h-12 w-full rounded-2xl border border-border bg-input pl-11 pr-4 text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground/70 hover:bg-input-hover focus:border-ring focus:ring-4 focus:ring-ring/20"
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-secondary-foreground">
            Destination
          </span>
          <input
            name="destination"
            defaultValue={query.destination}
            placeholder="Goa, Ladakh..."
            className="h-12 w-full rounded-2xl border border-border bg-input px-4 text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground/70 hover:bg-input-hover focus:border-ring focus:ring-4 focus:ring-ring/20"
          />
        </label>

        <ExploreDropdown
          name="duration"
          label="Duration"
          value={duration}
          onChange={setDuration}
          options={durationFilterOptions}
          isOpen={openDropdown === "duration"}
          onOpenChange={(open) => setOpenDropdown(open ? "duration" : null)}
        />

        <ExploreDropdown
          name="budget"
          label="Budget"
          value={budget}
          onChange={setBudget}
          options={budgetFilterOptions}
          isOpen={openDropdown === "budget"}
          onOpenChange={(open) => setOpenDropdown(open ? "budget" : null)}
        />

        <ExploreDropdown
          name="style"
          label="Style"
          value={style}
          onChange={setStyle}
          options={styleFilterOptions}
          isOpen={openDropdown === "style"}
          onOpenChange={(open) => setOpenDropdown(open ? "style" : null)}
        />

        <ExploreDropdown
          name="sort"
          label="Sort"
          value={sort}
          onChange={setSort}
          options={sortFilterOptions}
          isOpen={openDropdown === "sort"}
          onOpenChange={(open) => setOpenDropdown(open ? "sort" : null)}
        />

        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex h-12 flex-1 cursor-pointer items-center justify-center rounded-full bg-primary px-6 text-sm font-black text-primary-foreground shadow-lg shadow-primary/15 transition hover:-translate-y-0.5 hover:bg-primary-hover lg:flex-none"
          >
            Search
          </button>

          {hasFilters ? (
            <Link
              href="/explore"
              onClick={triggerExploreGridLoading}
              className="inline-flex h-12 cursor-pointer items-center justify-center rounded-full border border-border bg-card px-4 text-sm font-black text-foreground transition hover:bg-card-secondary sm:hidden"
            >
              Clear
            </Link>
          ) : null}
        </div>
      </div>
    </form>
  );
}

function ExploreDropdown({
  name,
  label,
  value,
  options,
  onChange,
  isOpen,
  onOpenChange,
}: {
  name: string;
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];

  return (
    <div className="relative z-50">
      <input type="hidden" name={name} value={value} />

      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-secondary-foreground">
        {label}
      </span>

      <button
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        className={`flex h-12 w-full cursor-pointer items-center justify-between gap-2 rounded-2xl border bg-input px-3.5 text-left text-sm font-black text-foreground outline-none transition ${
          isOpen
            ? "border-ring bg-card ring-4 ring-ring/20"
            : "border-border hover:bg-input-hover"
        }`}
      >
        <span className="min-w-0 truncate">{selectedOption?.label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-primary transition ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.55rem)] z-80 overflow-hidden rounded-[22px] border border-border bg-card p-1.5 shadow-[0_24px_65px_rgba(81,49,23,0.22)]">
          <div className="max-h-72 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={`${name}-${option.value || "all"}`}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    onOpenChange(false);
                  }}
                  className={`my-1 flex w-full cursor-pointer items-start justify-between gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-secondary-foreground hover:bg-card-secondary hover:text-foreground"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black">
                      {option.label}
                    </span>

                    {option.description ? (
                      <span
                        className={`mt-0.5 block line-clamp-1 text-xs font-semibold ${
                          isSelected
                            ? "text-primary-foreground/75"
                            : "text-muted-foreground"
                        }`}
                      >
                        {option.description}
                      </span>
                    ) : null}
                  </span>

                  {isSelected ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}