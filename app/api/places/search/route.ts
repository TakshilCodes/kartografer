import { NextResponse } from "next/server";
import { PlaceProvider } from "@prisma/client";

import prisma from "@/lib/prisma";

type GeoapifyFeature = {
  properties: {
    place_id?: string;
    name?: string;
    formatted?: string;
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    state?: string;
    county?: string;
    district?: string;
    country?: string;
    country_code?: string;
    lat?: number;
    lon?: number;
    result_type?: string;
  };
};

type PlaceResult = {
  provider: PlaceProvider;
  providerPlaceId: string;
  name: string;
  formattedName: string;
  city: string | null;
  state: string | null;
  country: string;
  countryCode: string;
  lat: number | null;
  lng: number | null;
};

const MIN_SEARCH_LENGTH = 3;
const MIN_DB_RESULTS = 5;
const MAX_RESULTS = 10;

const ALLOWED_RESULT_TYPES = new Set([
  "city",
  "state",
  "county",
  "district",
  "suburb",
  "village",
  "town",
  "locality",
]);

function normalizePlaceKey(value: string | null | undefined) {
  return (
    value
      ?.trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/&/g, "and") ?? ""
  );
}

function getPlaceKey(
  place: Pick<PlaceResult, "name" | "city" | "state" | "countryCode">
) {
  const logicalName = normalizePlaceKey(place.city ?? place.name);

  return [
    logicalName,
    normalizePlaceKey(place.state),
    normalizePlaceKey(place.countryCode),
  ].join("|");
}

function removeDuplicatePlaces(places: PlaceResult[]) {
  const uniquePlaces = new Map<string, PlaceResult>();

  for (const place of places) {
    const key = getPlaceKey(place);
    const existingPlace = uniquePlaces.get(key);

    if (!existingPlace) {
      uniquePlaces.set(key, place);
      continue;
    }

    const existingScore =
      (existingPlace.city ? 2 : 0) +
      (existingPlace.state ? 1 : 0) +
      (existingPlace.formattedName.includes(",") ? 1 : 0);

    const newScore =
      (place.city ? 2 : 0) +
      (place.state ? 1 : 0) +
      (place.formattedName.includes(",") ? 1 : 0);

    if (newScore > existingScore) {
      uniquePlaces.set(key, place);
    }
  }

  return Array.from(uniquePlaces.values());
}

function isPlaceResult(place: PlaceResult | null): place is PlaceResult {
  return place !== null;
}

async function fetchGeoapifyPlaces({
  endpoint,
  text,
  apiKey,
}: {
  endpoint: "autocomplete" | "search";
  text: string;
  apiKey: string;
}) {
  const geoapifyUrl = new URL(
    `https://api.geoapify.com/v1/geocode/${endpoint}`
  );

  geoapifyUrl.searchParams.set("text", text);
  geoapifyUrl.searchParams.set("filter", "countrycode:in");
  geoapifyUrl.searchParams.set("lang", "en");
  geoapifyUrl.searchParams.set("limit", String(MAX_RESULTS));
  geoapifyUrl.searchParams.set("format", "geojson");
  geoapifyUrl.searchParams.set("apiKey", apiKey);

  const response = await fetch(geoapifyUrl.toString(), {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();

  return data.features ?? [];
}

function mapGeoapifyFeature(feature: GeoapifyFeature): PlaceResult | null {
  const props = feature.properties;

  const countryCode = props.country_code?.toUpperCase();

  if (countryCode !== "IN") {
    return null;
  }

  if (props.result_type && !ALLOWED_RESULT_TYPES.has(props.result_type)) {
    return null;
  }

  const formattedName = props.formatted;

  const name =
    props.name ??
    props.city ??
    props.town ??
    props.village ??
    props.suburb ??
    props.county ??
    props.district ??
    props.state ??
    formattedName;

  if (!props.place_id || !name || !formattedName) {
    return null;
  }

  const city =
    props.city ??
    props.town ??
    props.village ??
    props.suburb ??
    (props.result_type === "city" ||
      props.result_type === "town" ||
      props.result_type === "village" ||
      props.result_type === "locality" ||
      props.result_type === "suburb"
      ? name
      : null);

  return {
    provider: PlaceProvider.GEOAPIFY,
    providerPlaceId: props.place_id,
    name,
    formattedName,
    city,
    state: props.state ?? null,
    country: props.country ?? "India",
    countryCode,
    lat: props.lat ?? null,
    lng: props.lon ?? null,
  };
}

async function searchPlacesFromDb(query: string): Promise<PlaceResult[]> {
  const places = await prisma.place.findMany({
    where: {
      countryCode: "IN",
      OR: [
        {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          formattedName: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          city: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          state: {
            contains: query,
            mode: "insensitive",
          },
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
    take: MAX_RESULTS,
  });

  return places
    .filter((place) => place.providerPlaceId)
    .map((place) => ({
      provider: place.provider,
      providerPlaceId: place.providerPlaceId as string,
      name: place.name,
      formattedName: place.formattedName,
      city: place.city,
      state: place.state,
      country: place.country,
      countryCode: place.countryCode ?? "IN",
      lat: place.lat,
      lng: place.lng,
    }));
}

async function saveGeoapifyPlacesToDb({
  places,
  existingDbPlaces,
}: {
  places: PlaceResult[];
  existingDbPlaces: PlaceResult[];
}) {
  const existingDbKeys = new Set(
    existingDbPlaces.map((place) => getPlaceKey(place))
  );

  const newGeoapifyPlaces = places.filter((place) => {
    if (place.provider !== PlaceProvider.GEOAPIFY) {
      return false;
    }

    const placeKey = getPlaceKey(place);

    return !existingDbKeys.has(placeKey);
  });

  if (newGeoapifyPlaces.length === 0) {
    return;
  }

  await Promise.allSettled(
    newGeoapifyPlaces.map((place) =>
      prisma.place.upsert({
        where: {
          provider_providerPlaceId: {
            provider: place.provider,
            providerPlaceId: place.providerPlaceId,
          },
        },
        update: {
          name: place.name,
          formattedName: place.formattedName,
          city: place.city,
          state: place.state,
          country: place.country,
          countryCode: place.countryCode,
          lat: place.lat,
          lng: place.lng,
        },
        create: {
          provider: place.provider,
          providerPlaceId: place.providerPlaceId,
          name: place.name,
          formattedName: place.formattedName,
          city: place.city,
          state: place.state,
          country: place.country,
          countryCode: place.countryCode,
          lat: place.lat,
          lng: place.lng,
        },
      })
    )
  );
}

export async function GET(req: Request) {
  try {
    const apiKey = process.env.GEOAPIFY_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { places: [], error: "Geoapify API key is missing." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < MIN_SEARCH_LENGTH) {
      return NextResponse.json({ places: [] });
    }

    const normalizedQuery = query.toLowerCase();

    const dbPlaces = removeDuplicatePlaces(
      await searchPlacesFromDb(normalizedQuery)
    );

    if (dbPlaces.length >= MIN_DB_RESULTS) {
      return NextResponse.json({
        places: dbPlaces.slice(0, MAX_RESULTS),
        source: "db",
      });
    }

    const autocompleteFeatures = await fetchGeoapifyPlaces({
      endpoint: "autocomplete",
      text: normalizedQuery,
      apiKey,
    });

    let geoapifyPlaces = removeDuplicatePlaces(
      autocompleteFeatures
        .map((feature: GeoapifyFeature) => mapGeoapifyFeature(feature))
        .filter(isPlaceResult)
    );

    let mergedPlaces = removeDuplicatePlaces([...dbPlaces, ...geoapifyPlaces]);

    if (mergedPlaces.length < MIN_DB_RESULTS) {
      const searchFeatures = await fetchGeoapifyPlaces({
        endpoint: "search",
        text: `${normalizedQuery} India`,
        apiKey,
      });

      const fallbackPlaces = searchFeatures
        .map((feature: GeoapifyFeature) => mapGeoapifyFeature(feature))
        .filter(isPlaceResult);

      geoapifyPlaces = removeDuplicatePlaces([
        ...geoapifyPlaces,
        ...fallbackPlaces,
      ]);

      mergedPlaces = removeDuplicatePlaces([...dbPlaces, ...geoapifyPlaces]);
    }

    const finalPlaces = mergedPlaces.slice(0, MAX_RESULTS);

    await saveGeoapifyPlacesToDb({
      places: finalPlaces,
      existingDbPlaces: dbPlaces,
    });

    return NextResponse.json({
      places: finalPlaces,
      source: dbPlaces.length > 0 ? "db_geoapify" : "geoapify",
    });
  } catch (error) {
    console.error("GEOAPIFY_PLACE_SEARCH_ERROR", error);

    return NextResponse.json(
      { places: [], error: "Something went wrong while searching places." },
      { status: 500 }
    );
  }
}