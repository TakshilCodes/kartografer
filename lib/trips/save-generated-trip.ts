import prisma from "@/lib/prisma";
import type { GeneratedTrip } from "@/lib/ai/schemas/generated-trip.schema";

type SaveGeneratedTripInput = {
  tripId: string;
  generatedTrip: GeneratedTrip;
};

export async function saveGeneratedTrip({
  tripId,
  generatedTrip,
}: SaveGeneratedTripInput) {
  const trip = await prisma.trip.findUnique({
    where: {
      id: tripId,
    },
    select: {
      id: true,
      days: {
        select: {
          id: true,
          dayNumber: true,
        },
      },
    },
  });

  if (!trip) {
    throw new Error("Trip not found while saving generated trip.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.trip.update({
      where: {
        id: tripId,
      },
      data: {
        title: generatedTrip.title,
        summary: generatedTrip.summary ?? null,
        isAiGenerated: true,
        status: "GENERATED",
      },
    });

    await tx.tripActivity.deleteMany({
      where: {
        tripId,
      },
    });

    await tx.transportOption.deleteMany({
      where: {
        tripId,
      },
    });

    await tx.stayOption.deleteMany({
      where: {
        tripId,
      },
    });

    await tx.mealSuggestion.deleteMany({
      where: {
        tripId,
      },
    });

    await tx.tripDay.deleteMany({
      where: {
        tripId,
      },
    });

    for (const generatedDay of generatedTrip.days) {
      const day = await tx.tripDay.create({
        data: {
          tripId,
          dayNumber: generatedDay.dayNumber,
          title: generatedDay.title,
          description: generatedDay.description ?? null,
          notes: generatedDay.notes ?? null,
        },
      });

      await saveDayItems({
        tx,
        tripId,
        tripDayId: day.id,
        selectedItems: generatedDay.selected,
        optionItems: generatedDay.options,
      });
    }
  });
}

type PrismaTransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

type SaveDayItemsInput = {
  tx: PrismaTransactionClient;
  tripId: string;
  tripDayId: string;
  selectedItems: GeneratedTrip["days"][number]["selected"];
  optionItems: GeneratedTrip["days"][number]["options"];
};

async function saveDayItems({
  tx,
  tripId,
  tripDayId,
  selectedItems,
  optionItems,
}: SaveDayItemsInput) {
  await saveTransportItems({
    tx,
    tripId,
    tripDayId,
    items: selectedItems.transports,
    isSelected: true,
  });

  await saveTransportItems({
    tx,
    tripId,
    tripDayId,
    items: optionItems.transports,
    isSelected: false,
  });

  await saveStayItems({
    tx,
    tripId,
    tripDayId,
    items: selectedItems.stays,
    isSelected: true,
  });

  await saveStayItems({
    tx,
    tripId,
    tripDayId,
    items: optionItems.stays,
    isSelected: false,
  });

  await saveMealItems({
    tx,
    tripId,
    tripDayId,
    items: selectedItems.meals,
    isSelected: true,
  });

  await saveMealItems({
    tx,
    tripId,
    tripDayId,
    items: optionItems.meals,
    isSelected: false,
  });

  await saveActivityItems({
    tx,
    tripId,
    tripDayId,
    items: selectedItems.activities,
    isSelected: true,
  });

  await saveActivityItems({
    tx,
    tripId,
    tripDayId,
    items: optionItems.activities,
    isSelected: false,
  });
}

type SaveCommonInput<TItem> = {
  tx: PrismaTransactionClient;
  tripId: string;
  tripDayId: string;
  items: TItem[];
  isSelected: boolean;
};

async function saveTransportItems({
  tx,
  tripId,
  tripDayId,
  items,
  isSelected,
}: SaveCommonInput<GeneratedTrip["days"][number]["selected"]["transports"][number]>) {
  if (items.length === 0) return;

  await tx.transportOption.createMany({
    data: items.map((item) => ({
      tripId,
      tripDayId,
      title: item.title,
      mode: item.mode,
      fromText: item.fromText ?? null,
      toText: item.toText ?? null,
      description: item.description ?? null,
      costType: item.costType,
      pricePerPerson: item.pricePerPerson ?? null,
      totalCost: item.totalCost ?? null,
      isSelected,
      source: "AI_GENERATED",
      notes: item.notes ?? null,
    })),
  });
}

async function saveStayItems({
  tx,
  tripId,
  tripDayId,
  items,
  isSelected,
}: SaveCommonInput<GeneratedTrip["days"][number]["selected"]["stays"][number]>) {
  if (items.length === 0) return;

  await tx.stayOption.createMany({
    data: items.map((item) => ({
      tripId,
      tripDayId,
      name: item.name,
      city: item.city ?? null,
      area: item.area ?? null,
      stayType: item.stayType,
      budgetLevel: item.budgetLevel,
      pricePerNight: item.pricePerNight ?? null,
      nights: item.nights ?? null,
      totalCost: item.totalCost ?? null,
      isSelected,
      bestFor: item.bestFor ?? null,
      source: "AI_GENERATED",
      notes: item.notes ?? null,
    })),
  });
}

async function saveMealItems({
  tx,
  tripId,
  tripDayId,
  items,
  isSelected,
}: SaveCommonInput<GeneratedTrip["days"][number]["selected"]["meals"][number]>) {
  if (items.length === 0) return;

  await tx.mealSuggestion.createMany({
    data: items.map((item) => ({
      tripId,
      tripDayId,
      mealType: item.mealType,
      title: item.title,
      locationName: item.locationName ?? null,
      estimatedCost: item.estimatedCost ?? null,
      isSelected,
      source: "AI_GENERATED",
      notes: item.notes ?? null,
    })),
  });
}

async function saveActivityItems({
  tx,
  tripId,
  tripDayId,
  items,
  isSelected,
}: SaveCommonInput<GeneratedTrip["days"][number]["selected"]["activities"][number]>) {
  if (items.length === 0) return;

  await tx.tripActivity.createMany({
    data: items.map((item, index) => ({
      tripId,
      tripDayId,
      title: item.title,
      description: item.description ?? null,
      locationName: item.locationName ?? null,
      address: item.address ?? null,
      startTime: item.startTime ?? null,
      endTime: item.endTime ?? null,
      durationMinutes: item.durationMinutes ?? null,
      category: item.category,
      estimatedCost: item.estimatedCost ?? null,
      isSelected,
      source: "AI_GENERATED",
      notes: item.notes ?? null,
      position: item.position ?? index,
    })),
  });
}