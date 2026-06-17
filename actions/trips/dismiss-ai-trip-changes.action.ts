"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const dismissAiTripChangesSchema = z.object({
  proposalId: z.string().trim().min(1, "Proposal id is required."),
});

type DismissAiTripChangesInput = z.infer<typeof dismissAiTripChangesSchema>;

export async function dismissAiTripChangesAction(
  input: DismissAiTripChangesInput
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        ok: false,
        error: "You must be logged in to dismiss AI changes.",
      };
    }

    const parsed = dismissAiTripChangesSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid proposal.",
      };
    }

    const proposal = await prisma.tripChatMessage.findFirst({
      where: {
        id: parsed.data.proposalId,
        role: "ASSISTANT",
        trip: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
        tripId: true,
        status: true,
      },
    });

    if (!proposal) {
      return {
        ok: false,
        error: "Proposal not found.",
      };
    }

    if (proposal.status !== "PENDING") {
      return {
        ok: false,
        error: "This proposal is no longer pending.",
      };
    }

    await prisma.tripChatMessage.update({
      where: {
        id: proposal.id,
      },
      data: {
        status: "DISCARDED",
      },
    });

    revalidatePath(`/dashboard/trips/${proposal.tripId}/edit`);

    return {
      ok: true,
      error: null,
    };
  } catch (error) {
    console.error("DISMISS_AI_TRIP_CHANGES_ERROR", error);

    return {
      ok: false,
      error: "Something went wrong while dismissing AI changes.",
    };
  }
}
