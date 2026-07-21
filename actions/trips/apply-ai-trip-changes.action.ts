"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { parseStoredTripChatPayload } from "@/lib/ai/trip-chat/proposal";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { recalculateTripCost } from "@/lib/trips/recalculate-trip-cost";
import { MAX_TRIP_DAYS } from "@/lib/trips/trip-limits";

const applyAiTripChangesSchema = z.object({
  proposalId: z.string().trim().min(1, "Proposal id is required."),
});
type ApplyAiTripChangesInput = z.infer<typeof applyAiTripChangesSchema>;
type PrismaTransaction = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

async function ensureDayExists(
  tx: PrismaTransaction,
  tripId: string,
  dayId: string,
) {
  const day = await tx.tripDay.findFirst({
    where: { id: dayId, tripId },
    select: { id: true },
  });
  if (!day) throw new Error("A proposed day no longer exists in this trip.");
}

function assertChanged(
  count: number,
  message = "A proposed item no longer exists in this trip.",
) {
  if (count === 0) throw new Error(message);
}

async function resolveDayTarget(
  tx: PrismaTransaction,
  tripId: string,
  target: { dayId?: string; dayRef?: string },
  dayIdsByRef: Map<string, string>,
) {
  const dayId =
    target.dayId ?? (target.dayRef ? dayIdsByRef.get(target.dayRef) : null);
  if (!dayId)
    throw new Error("A proposed new-day reference could not be resolved.");
  await ensureDayExists(tx, tripId, dayId);
  return dayId;
}

export async function applyAiTripChangesAction(input: ApplyAiTripChangesInput) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return { ok: false, error: "You must be logged in to apply AI changes." };
    const parsed = applyAiTripChangesSchema.safeParse(input);
    if (!parsed.success)
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid proposal.",
      };

    const proposal = await prisma.tripChatMessage.findFirst({
      where: {
        id: parsed.data.proposalId,
        role: "ASSISTANT",
        trip: { userId: session.user.id },
      },
      select: {
        id: true,
        tripId: true,
        status: true,
        proposedChangesJson: true,
      },
    });
    if (!proposal) return { ok: false, error: "Proposal not found." };
    if (proposal.status !== "PENDING")
      return { ok: false, error: "This proposal is no longer pending." };
    const stored = parseStoredTripChatPayload(proposal.proposedChangesJson);
    if (!stored || stored.changes.length === 0)
      return {
        ok: false,
        error: "This proposal does not contain valid changes.",
      };

    await prisma.$transaction(async (tx) => {
      const claim = await tx.tripChatMessage.updateMany({
        where: {
          id: proposal.id,
          tripId: proposal.tripId,
          status: "PENDING",
        },
        data: { status: "APPLIED" },
      });
      if (claim.count !== 1) {
        throw new Error("This proposal is no longer pending.");
      }

      const dayIdsByRef = new Map<string, string>();
      const addDayChanges = stored.changes.filter(
        (change): change is Extract<typeof change, { type: "ADD_DAY" }> =>
          change.type === "ADD_DAY",
      );
      if (addDayChanges.length > 1) {
        throw new Error("Only one day can be added by a single proposal.");
      }

      const addDay = addDayChanges[0];
      if (addDay) {
        const trip = await tx.trip.findUnique({
          where: { id: proposal.tripId },
          select: {
            daysCount: true,
            days: {
              orderBy: { dayNumber: "desc" },
              take: 1,
              select: { dayNumber: true },
            },
          },
        });
        if (!trip) throw new Error("Trip not found.");
        const highestDayNumber = trip.days[0]?.dayNumber ?? 0;
        if (Math.max(trip.daysCount, highestDayNumber) >= MAX_TRIP_DAYS) {
          throw new Error(
            `A trip cannot have more than ${MAX_TRIP_DAYS} days.`,
          );
        }
        const newDayNumber = highestDayNumber + 1;
        const createdDay = await tx.tripDay.create({
          data: {
            tripId: proposal.tripId,
            dayNumber: newDayNumber,
            title: addDay.data.title ?? `Day ${newDayNumber}`,
            description: addDay.data.description ?? null,
            notes: addDay.data.notes ?? null,
            estimatedCost: null,
          },
          select: { id: true },
        });
        await tx.trip.update({
          where: { id: proposal.tripId },
          data: { daysCount: newDayNumber },
        });
        dayIdsByRef.set(addDay.dayRef, createdDay.id);
      }

      for (const change of stored.changes) {
        switch (change.type) {
          case "ADD_ACTIVITY": {
            const dayId = await resolveDayTarget(
              tx,
              proposal.tripId,
              { dayId: change.dayId, dayRef: change.dayRef },
              dayIdsByRef,
            );
            await tx.tripActivity.create({
              data: {
                tripId: proposal.tripId,
                tripDayId: dayId,
                title: change.data.title,
                description: change.data.description ?? null,
                locationName: change.data.locationName ?? null,
                address: change.data.address ?? null,
                startTime: change.data.startTime ?? null,
                endTime: change.data.endTime ?? null,
                durationMinutes: change.data.durationMinutes ?? null,
                category: change.data.category,
                estimatedCost: null,
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
                isSelected: true,
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
                isSelected: true,
              },
            });
            assertChanged(result.count);
            break;
          }
          case "SELECT_ACTIVITY_OPTION": {
            const destinationDayId = await resolveDayTarget(
              tx,
              proposal.tripId,
              {
                dayId:
                  change.targetDayId ??
                  (change.targetDayRef ? undefined : change.dayId),
                dayRef: change.targetDayRef,
              },
              dayIdsByRef,
            );
            if (change.replaceSelectedItemId) {
              const replacement = await tx.tripActivity.updateMany({
                where: {
                  id: change.replaceSelectedItemId,
                  tripId: proposal.tripId,
                  tripDayId: destinationDayId,
                  isSelected: true,
                },
                data: { isSelected: false },
              });
              assertChanged(
                replacement.count,
                "The activity being replaced is no longer selected on the destination day.",
              );
            }
            const option = await tx.tripActivity.updateMany({
              where: {
                id: change.optionId,
                tripId: proposal.tripId,
                tripDayId: change.dayId,
                isSelected: false,
              },
              data: { isSelected: true, tripDayId: destinationDayId },
            });
            assertChanged(
              option.count,
              "The activity option is missing, belongs to another trip/source day, or is already selected.",
            );
            break;
          }
          case "ADD_MEAL": {
            const dayId = await resolveDayTarget(
              tx,
              proposal.tripId,
              { dayId: change.dayId, dayRef: change.dayRef },
              dayIdsByRef,
            );
            await tx.mealSuggestion.create({
              data: {
                tripId: proposal.tripId,
                tripDayId: dayId,
                mealType: change.data.mealType,
                title: change.data.title,
                locationName: change.data.locationName ?? null,
                estimatedCost: null,
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
                isSelected: true,
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
                isSelected: true,
              },
            });
            assertChanged(result.count);
            break;
          }
          case "SELECT_MEAL_OPTION": {
            const destinationDayId = await resolveDayTarget(
              tx,
              proposal.tripId,
              {
                dayId:
                  change.targetDayId ??
                  (change.targetDayRef ? undefined : change.dayId),
                dayRef: change.targetDayRef,
              },
              dayIdsByRef,
            );
            if (change.replaceSelectedItemId) {
              const replacement = await tx.mealSuggestion.updateMany({
                where: {
                  id: change.replaceSelectedItemId,
                  tripId: proposal.tripId,
                  tripDayId: destinationDayId,
                  isSelected: true,
                },
                data: { isSelected: false },
              });
              assertChanged(
                replacement.count,
                "The meal being replaced is no longer selected on the destination day.",
              );
            }
            const option = await tx.mealSuggestion.updateMany({
              where: {
                id: change.optionId,
                tripId: proposal.tripId,
                tripDayId: change.dayId,
                isSelected: false,
              },
              data: { isSelected: true, tripDayId: destinationDayId },
            });
            assertChanged(
              option.count,
              "The meal option is missing, belongs to another trip/source day, or is already selected.",
            );
            break;
          }
          case "ADD_TRANSPORT": {
            const dayId = await resolveDayTarget(
              tx,
              proposal.tripId,
              { dayId: change.dayId, dayRef: change.dayRef },
              dayIdsByRef,
            );
            await tx.transportOption.create({
              data: {
                tripId: proposal.tripId,
                tripDayId: dayId,
                title: change.data.title,
                mode: change.data.mode,
                fromText: change.data.fromText ?? null,
                toText: change.data.toText ?? null,
                description: change.data.description ?? null,
                costType: change.data.costType ?? "TOTAL",
                pricePerPerson: null,
                totalCost: null,
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
                isSelected: true,
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
                isSelected: true,
              },
            });
            assertChanged(result.count);
            break;
          }
          case "SELECT_TRANSPORT_OPTION": {
            const destinationDayId = await resolveDayTarget(
              tx,
              proposal.tripId,
              {
                dayId:
                  change.targetDayId ??
                  (change.targetDayRef ? undefined : change.dayId),
                dayRef: change.targetDayRef,
              },
              dayIdsByRef,
            );
            if (change.replaceSelectedItemId) {
              const replacement = await tx.transportOption.updateMany({
                where: {
                  id: change.replaceSelectedItemId,
                  tripId: proposal.tripId,
                  tripDayId: destinationDayId,
                  isSelected: true,
                },
                data: { isSelected: false },
              });
              assertChanged(
                replacement.count,
                "The transport being replaced is no longer selected on the destination day.",
              );
            }
            const option = await tx.transportOption.updateMany({
              where: {
                id: change.optionId,
                tripId: proposal.tripId,
                tripDayId: change.dayId,
                isSelected: false,
              },
              data: { isSelected: true, tripDayId: destinationDayId },
            });
            assertChanged(
              option.count,
              "The transport option is missing, belongs to another trip/source day, or is already selected.",
            );
            break;
          }
          case "ADD_STAY": {
            const dayId = await resolveDayTarget(
              tx,
              proposal.tripId,
              { dayId: change.dayId, dayRef: change.dayRef },
              dayIdsByRef,
            );
            await tx.stayOption.create({
              data: {
                tripId: proposal.tripId,
                tripDayId: dayId,
                name: change.data.name,
                city: change.data.city ?? null,
                area: change.data.area ?? null,
                stayType: change.data.stayType ?? "OTHER",
                budgetLevel: change.data.budgetLevel ?? "MID_RANGE",
                pricePerNight: null,
                nights: change.data.nights ?? null,
                totalCost: null,
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
                isSelected: true,
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
                isSelected: true,
              },
            });
            assertChanged(result.count);
            break;
          }
          case "SELECT_STAY_OPTION": {
            const destinationDayId = await resolveDayTarget(
              tx,
              proposal.tripId,
              {
                dayId:
                  change.targetDayId ??
                  (change.targetDayRef ? undefined : change.dayId),
                dayRef: change.targetDayRef,
              },
              dayIdsByRef,
            );
            if (change.replaceSelectedItemId) {
              const replacement = await tx.stayOption.updateMany({
                where: {
                  id: change.replaceSelectedItemId,
                  tripId: proposal.tripId,
                  tripDayId: destinationDayId,
                  isSelected: true,
                },
                data: { isSelected: false },
              });
              assertChanged(
                replacement.count,
                "The stay being replaced is no longer selected on the destination day.",
              );
            }
            const option = await tx.stayOption.updateMany({
              where: {
                id: change.optionId,
                tripId: proposal.tripId,
                tripDayId: change.dayId,
                isSelected: false,
              },
              data: { isSelected: true, tripDayId: destinationDayId },
            });
            assertChanged(
              option.count,
              "The stay option is missing, belongs to another trip/source day, or is already selected.",
            );
            break;
          }
          case "ADD_DAY":
            break;
          case "MOVE_ITINERARY_ITEM": {
            const destinationDayId = await resolveDayTarget(
              tx,
              proposal.tripId,
              {
                dayId: change.targetDayId,
                dayRef: change.targetDayRef,
              },
              dayIdsByRef,
            );
            const where = {
              id: change.itemId,
              tripId: proposal.tripId,
              tripDayId: change.fromDayId,
              isSelected: true,
            };
            const result =
              change.category === "ACTIVITY"
                ? await tx.tripActivity.updateMany({
                    where,
                    data: { tripDayId: destinationDayId },
                  })
                : change.category === "MEAL"
                  ? await tx.mealSuggestion.updateMany({
                      where,
                      data: { tripDayId: destinationDayId },
                    })
                  : change.category === "TRANSPORT"
                    ? await tx.transportOption.updateMany({
                        where,
                        data: { tripDayId: destinationDayId },
                      })
                    : await tx.stayOption.updateMany({
                        where,
                        data: { tripDayId: destinationDayId },
                      });
            assertChanged(
              result.count,
              "The item being moved is no longer selected on its source day.",
            );
            break;
          }
          case "UPDATE_DAY": {
            const result = await tx.tripDay.updateMany({
              where: { id: change.dayId, tripId: proposal.tripId },
              data: change.data,
            });
            assertChanged(result.count);
            break;
          }
        }
      }
    });

    await recalculateTripCost(proposal.tripId);
    revalidatePath(`/dashboard/trips/${proposal.tripId}`);
    revalidatePath(`/dashboard/trips/${proposal.tripId}/edit`);
    return { ok: true, error: null };
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
