"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { clonePublicTripForUser } from "@/lib/trips/clone-trip";

const inputSchema = z.object({
  publicTripId: z.string().trim().min(1, "Trip id is required."),
});

export async function publicTripAsTemplateAction(input: {
  publicTripId: string;
}) {
  const parsed = inputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid trip.",
    };
  }

  const publicTripId = parsed.data.publicTripId;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/explore/${publicTripId}`)}`);
  }

  let clonedTripId: string;

  try {
    const clonedTrip = await clonePublicTripForUser({
      publicTripId,
      userId: session.user.id,
    });

    if (!clonedTrip) {
      return {
        ok: false as const,
        error: "This public itinerary is no longer available.",
      };
    }

    clonedTripId = clonedTrip.id;

    revalidatePath("/explore");
    revalidatePath(`/explore/${publicTripId}`);
    revalidatePath("/dashboard/trips");
  } catch (error) {
    console.error("USE_PUBLIC_TRIP_AS_TEMPLATE_ERROR", error);

    return {
      ok: false as const,
      error: "Something went wrong while copying this itinerary.",
    };
  }

  redirect(`/dashboard/trips/${clonedTripId}/edit`);
}