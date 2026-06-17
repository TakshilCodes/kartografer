"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { tripAiChangeProposalSchema } from "@/lib/ai/schemas/trip-ai-change.schema";
import { recalculateTripCost } from "@/lib/trips/recalculate-trip-cost";

const applyAiTripChangesSchema = z.object({
  proposalId: z.string().trim().min(1, "Proposal id is required."),
});

type ApplyAiTripChangesInput = z.infer<typeof applyAiTripChangesSchema>;

type PrismaTransaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function ensureDayExists(
  tx: PrismaTransaction,
  tripId: string,
  dayId: string
) {
  const day = await tx.tripDay.findFirst({
    where: {
      id: dayId,
      tripId,
    },
    select: {
      id: true,
    },
  });

  if (!day) {
    throw new Error("A proposed day no longer exists in this trip.");
  }
}

function assertChanged(count: number) {
  if (count === 0) {
    throw new Error("A proposed item no longer exists in this trip.");
  }
}

export async function applyAiTripChangesAction(
  input: ApplyAiTripChangesInput
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        ok: false,
        error: "You must be logged in to apply AI changes.",
      };
    }

    const parsed = applyAiTripChangesSchema.safeParse(input);

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
        proposedChangesJson: true,
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

    const parsedProposal = tripAiChangeProposalSchema.safeParse({
      changes: proposal.proposedChangesJson,
    });

    if (!parsedProposal.success || parsedProposal.data.changes.length === 0) {
      return {
        ok: false,
        error: "This proposal does not contain valid changes.",
      };
    }

    await prisma.$transaction(async (tx) => {
      for (const change of parsedProposal.data.changes) {
        switch (change.type) {
          case "ADD_ACTIVITY": {
            await ensureDayExists(tx, proposal.tripId, change.dayId);

            await tx.tripActivity.create({
              data: {
                tripId: proposal.tripId,
                tripDayId: change.dayId,
                title: change.data.title,
                description: change.data.description ?? null,
                locationName: change.data.locationName ?? null,
                address: change.data.address ?? null,
                startTime: change.data.startTime ?? null,
                endTime: change.data.endTime ?? null,
                durationMinutes: change.data.durationMinutes ?? null,
                category: change.data.category,
                estimatedCost: change.data.estimatedCost ?? null,
                notes: change.data.notes ?? null,
                position: change.data.position ?? 0,
                isSelected: true,
                source: "AI_EDITED",
              },
            });
            break;
          }

          case "UPDATE_ACTIVITY": {
            const result = await tx.tripActivity.updateMany({
              where: {
                id: change.activityId,
                tripId: proposal.tripId,
              },
              data: change.data,
            });

            assertChanged(result.count);
            break;
          }

          case "DELETE_ACTIVITY": {
            const result = await tx.tripActivity.deleteMany({
              where: {
                id: change.activityId,
                tripId: proposal.tripId,
              },
            });

            assertChanged(result.count);
            break;
          }

          case "ADD_MEAL": {
            await ensureDayExists(tx, proposal.tripId, change.dayId);

            await tx.mealSuggestion.create({
              data: {
                tripId: proposal.tripId,
                tripDayId: change.dayId,
                mealType: change.data.mealType,
                title: change.data.title,
                locationName: change.data.locationName ?? null,
                estimatedCost: change.data.estimatedCost ?? null,
                notes: change.data.notes ?? null,
                isSelected: true,
                source: "AI_EDITED",
              },
            });
            break;
          }

          case "UPDATE_MEAL": {
            const result = await tx.mealSuggestion.updateMany({
              where: {
                id: change.mealId,
                tripId: proposal.tripId,
              },
              data: change.data,
            });

            assertChanged(result.count);
            break;
          }

          case "DELETE_MEAL": {
            const result = await tx.mealSuggestion.deleteMany({
              where: {
                id: change.mealId,
                tripId: proposal.tripId,
              },
            });

            assertChanged(result.count);
            break;
          }

          case "ADD_TRANSPORT": {
            await ensureDayExists(tx, proposal.tripId, change.dayId);

            await tx.transportOption.create({
              data: {
                tripId: proposal.tripId,
                tripDayId: change.dayId,
                title: change.data.title,
                mode: change.data.mode,
                fromText: change.data.fromText ?? null,
                toText: change.data.toText ?? null,
                description: change.data.description ?? null,
                costType: change.data.costType ?? "TOTAL",
                pricePerPerson: change.data.pricePerPerson ?? null,
                totalCost: change.data.totalCost ?? null,
                notes: change.data.notes ?? null,
                isSelected: true,
                source: "AI_EDITED",
              },
            });
            break;
          }

          case "UPDATE_TRANSPORT": {
            const result = await tx.transportOption.updateMany({
              where: {
                id: change.transportId,
                tripId: proposal.tripId,
              },
              data: change.data,
            });

            assertChanged(result.count);
            break;
          }

          case "DELETE_TRANSPORT": {
            const result = await tx.transportOption.deleteMany({
              where: {
                id: change.transportId,
                tripId: proposal.tripId,
              },
            });

            assertChanged(result.count);
            break;
          }

          case "ADD_STAY": {
            await ensureDayExists(tx, proposal.tripId, change.dayId);

            await tx.stayOption.create({
              data: {
                tripId: proposal.tripId,
                tripDayId: change.dayId,
                name: change.data.name,
                city: change.data.city ?? null,
                area: change.data.area ?? null,
                stayType: change.data.stayType ?? "OTHER",
                budgetLevel: change.data.budgetLevel ?? "MID_RANGE",
                pricePerNight: change.data.pricePerNight ?? null,
                nights: change.data.nights ?? null,
                totalCost: change.data.totalCost ?? null,
                bestFor: change.data.bestFor ?? null,
                notes: change.data.notes ?? null,
                isSelected: true,
                source: "AI_EDITED",
              },
            });
            break;
          }

          case "UPDATE_STAY": {
            const result = await tx.stayOption.updateMany({
              where: {
                id: change.stayId,
                tripId: proposal.tripId,
              },
              data: change.data,
            });

            assertChanged(result.count);
            break;
          }

          case "DELETE_STAY": {
            const result = await tx.stayOption.deleteMany({
              where: {
                id: change.stayId,
                tripId: proposal.tripId,
              },
            });

            assertChanged(result.count);
            break;
          }

          case "UPDATE_DAY": {
            const result = await tx.tripDay.updateMany({
              where: {
                id: change.dayId,
                tripId: proposal.tripId,
              },
              data: change.data,
            });

            assertChanged(result.count);
            break;
          }
        }
      }

      await tx.tripChatMessage.update({
        where: {
          id: proposal.id,
        },
        data: {
          status: "APPLIED",
        },
      });
    });

    await recalculateTripCost(proposal.tripId);
    revalidatePath(`/dashboard/trips/${proposal.tripId}`);
    revalidatePath(`/dashboard/trips/${proposal.tripId}/edit`);

    return {
      ok: true,
      error: null,
    };
  } catch (error) {
    console.error("APPLY_AI_TRIP_CHANGES_ERROR", error);

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Something went wrong while applying AI changes.",
    };
  }
}
