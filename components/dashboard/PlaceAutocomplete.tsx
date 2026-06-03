"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, MapPin, Search, X } from "lucide-react";

import { useDebounce } from "@/hooks/useDebounce";

export type PlaceOption = {
  provider: "MANUAL" | "GEOAPIFY" | "MAPBOX" | "GOOGLE" | "NOMINATIM";
  providerPlaceId: string;
  name: string;
  formattedName: string;
  city?: string | null;
  state?: string | null;
  country: string;
  countryCode?: string | null;
  lat?: number | null;
  lng?: number | null;
};

type PlaceAutocompleteProps = {
  name: string;
  label: string;
  placeholder: string;
  icon?: React.ReactNode;
};

export default function PlaceAutocomplete({
  name,
  label,
  placeholder,
  icon = <MapPin className="h-4 w-4" />,
}: PlaceAutocompleteProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<PlaceOption | null>(null);
  const [places, setPlaces] = useState<PlaceOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 400);

  const isTyping =
    query.trim().length >= 2 &&
    query.trim() !== debouncedQuery.trim() &&
    !selectedPlace;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (selectedPlace) {
      return;
    }

    const trimmedQuery = debouncedQuery.trim();

    if (trimmedQuery.length < 2) {
      setPlaces([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    async function searchPlaces() {
      try {
        setIsLoading(true);
        setIsOpen(true);

        const response = await fetch(
          `/api/places/search?q=${encodeURIComponent(trimmedQuery)}`
        );

        const data = await response.json();

        if (!response.ok) {
          setPlaces([]);
          return;
        }

        setPlaces(data.places ?? []);
      } catch (error) {
        console.error("PLACE_SEARCH_ERROR", error);
        setPlaces([]);
      } finally {
        setIsLoading(false);
      }
    }

    searchPlaces();
  }, [debouncedQuery, selectedPlace]);

  function handleInputChange(value: string) {
    setQuery(value);
    setSelectedPlace(null);

    if (value.trim().length >= 2) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setPlaces([]);
    }
  }

  function handleSelect(place: PlaceOption) {
    setSelectedPlace(place);
    setQuery(place.formattedName);
    setPlaces([]);
    setIsOpen(false);
  }

  function handleClear() {
    setQuery("");
    setSelectedPlace(null);
    setPlaces([]);
    setIsOpen(false);
  }

  const shouldShowDropdown =
    isOpen && query.trim().length >= 2 && !selectedPlace;

  const shouldShowSkeleton = shouldShowDropdown && (isTyping || isLoading);

  const shouldShowNoResults =
    shouldShowDropdown &&
    !isTyping &&
    !isLoading &&
    debouncedQuery.trim().length >= 2 &&
    places.length === 0;

  return (
    <div ref={wrapperRef} className="relative">
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-black text-foreground"
      >
        {label}
      </label>

      <input
        type="hidden"
        name={name}
        value={selectedPlace ? JSON.stringify(selectedPlace) : ""}
      />

      <div
        className={`flex items-center gap-3 rounded-2xl border bg-input px-4 py-3 transition ${
          shouldShowDropdown
            ? "border-ring ring-4 ring-ring/20"
            : "border-border hover:bg-input-hover"
        }`}
      >
        <span className="text-secondary-foreground">{icon}</span>

        <input
          id={name}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2 && !selectedPlace) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground/70"
        />

        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}

        {!isLoading && selectedPlace && (
          <Check className="h-4 w-4 text-success" />
        )}

        {!isLoading && query && (
          <button
            type="button"
            onClick={handleClear}
            className="cursor-pointer rounded-full p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {!isLoading && !query && (
          <Search className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {shouldShowDropdown && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-xl">
          {shouldShowSkeleton && <PlaceDropdownSkeleton />}

          {!shouldShowSkeleton &&
            places.map((place) => (
              <button
                key={`${place.provider}-${place.providerPlaceId}`}
                type="button"
                onClick={() => handleSelect(place)}
                className="flex w-full cursor-pointer items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-secondary"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-card-secondary text-secondary-foreground">
                  <MapPin className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-foreground">
                    {place.name}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs font-semibold text-muted-foreground">
                    {place.formattedName}
                  </p>
                </div>
              </button>
            ))}

          {shouldShowNoResults && (
            <div className="px-3 py-4 text-sm font-bold text-muted-foreground">
              No India places found. Try a different search.
            </div>
          )}
        </div>
      )}

      {query.trim().length >= 2 && !selectedPlace && !isLoading && (
        <p className="mt-2 text-xs font-bold text-warning">
          Please select a place from the dropdown.
        </p>
      )}
    </div>
  );
}

function PlaceDropdownSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex items-start gap-3 rounded-xl px-3 py-3"
        >
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-xl bg-card-secondary" />

          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3.5 w-2/5 animate-pulse rounded-full bg-card-secondary" />
            <div className="h-3 w-4/5 animate-pulse rounded-full bg-card-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}