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

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(`/explore/${parsed.data.publicTripId}`)}`
    );
  }

  try {
    const clonedTrip = await clonePublicTripForUser({
      publicTripId: parsed.data.publicTripId,
      userId: session.user.id,
    });

    if (!clonedTrip) {
      return {
        ok: false as const,
        error: "This public itinerary is no longer available.",
      };
    }

    revalidatePath("/explore");
    revalidatePath(`/explore/${parsed.data.publicTripId}`);
    revalidatePath("/dashboard/trips");

    redirect(`/dashboard/trips/${clonedTrip.id}/edit`);
  } catch (error) {
    console.error("USE_PUBLIC_TRIP_AS_TEMPLATE_ERROR", error);

    return {
      ok: false as const,
      error: "Something went wrong while copying this itinerary.",
    };
  }
}