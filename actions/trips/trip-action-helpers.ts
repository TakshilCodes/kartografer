import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";

export function cleanNullableText(value?: string | null) {
  return value?.trim() ? value.trim() : null;
}

export function revalidateTripEditorPages(tripId: string) {
  revalidatePath(`/dashboard/trips/${tripId}`);
  revalidatePath(`/dashboard/trips/${tripId}/edit`);
  revalidatePath("/dashboard/new");
}

export async function findOwnedTrip(tripId: string, userId: string) {
  return prisma.trip.findFirst({
    where: { id: tripId, userId },
    select: { id: true },
  });
}

export async function tripDayBelongsToTrip(
  tripDayId: string | null | undefined,
  tripId: string,
) {
  if (!tripDayId) return true;

  const tripDay = await prisma.tripDay.findFirst({
    where: { id: tripDayId, tripId },
    select: { id: true },
  });

  return Boolean(tripDay);
}
