"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { extractJsonFromAiText } from "@/lib/ai/ai-client";
import { getRetryAiErrorMessage } from "@/lib/ai/ai-error-details";
import { generateTextWithGemini } from "@/lib/ai/gemini.provider";
import { buildTripChatPrompt } from "@/lib/ai/prompts/trip-chat.prompt";
import {
  tripAiChangeResponseSchema,
  type TripAiChange,
} from "@/lib/ai/schemas/trip-ai-change.schema";
import prisma from "@/lib/prisma";
import {
  consumeAiChatLimit,
  getAiRateLimitErrorMessage,
} from "@/lib/rate-limit/ai-rate-limit";
import type { TripChatPromptItem } from "@/lib/ai/prompts/trip-chat.prompt";

const sendTripChatMessageSchema = z.object({
  tripId: z.string().trim().min(1, "Trip id is required."),
  message: z
    .string()
    .trim()
    .min(1, "Message is required.")
    .max(1200, "Message is too long."),
});

type SendTripChatMessageInput = z.infer<typeof sendTripChatMessageSchema>;

export type ChatMessageDto = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  proposal: AiChangeProposalDto | null;
};

export type AiChangeProposalDto = {
  id: string;
  status: "pending" | "applied" | "dismissed";
  summary: string | null;
  changes: Array<{
    type: TripAiChange["type"];
    label: string;
    reason: string;
  }>;
};

type SendTripChatMessageResult =
  | {
      ok: true;
      userMessage: ChatMessageDto;
      assistantMessage: ChatMessageDto;
      error: null;
    }
  | {
      ok: false;
      error: string;
    };

type SelectedItemByDay = Record<string, TripChatPromptItem[]>;

function toMessageDto(message: {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  createdAt: Date;
  proposedChangesJson?: unknown;
  changeSummary?: string | null;
  status?: "NONE" | "PENDING" | "APPLIED" | "DISCARDED";
}): ChatMessageDto {
  const parsedProposal =
    tripAiChangeResponseSchema.shape.proposedChanges.safeParse(
      message.proposedChangesJson,
    );
  const changes = parsedProposal.success ? parsedProposal.data : [];
  const status = message.status ?? "NONE";

  return {
    id: message.id,
    role: message.role === "USER" ? "user" : "assistant",
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    proposal:
      message.role === "ASSISTANT" && changes.length > 0 && status !== "NONE"
        ? {
            id: message.id,
            status:
              status === "APPLIED"
                ? "applied"
                : status === "DISCARDED"
                  ? "dismissed"
                  : "pending",
            summary: message.changeSummary ?? null,
            changes: changes.map((change) => ({
              type: change.type,
              label: change.label,
              reason: change.reason,
            })),
          }
        : null,
  };
}

function getNumberText(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const numberValue = Number(value);

  return Number.isNaN(numberValue) ? null : numberValue.toString();
}

function addItem(
  map: SelectedItemByDay,
  tripDayId: string | null,
  item: TripChatPromptItem,
) {
  if (!tripDayId) return;

  map[tripDayId] = [...(map[tripDayId] ?? []), item];
}

function formatCost(label: string, value: unknown) {
  const cost = getNumberText(value);

  return cost ? `${label}: ${cost}` : null;
}

function parseAiChatResponse(text: string) {
  try {
    const json = extractJsonFromAiText(text);
    const parsed = tripAiChangeResponseSchema.safeParse(json);

    if (parsed.success) {
      return parsed.data;
    }

    console.error(
      "TRIP_CHAT_PROPOSAL_VALIDATION_ERROR",
      parsed.error.flatten(),
    );

    if (
      typeof json === "object" &&
      json !== null &&
      "assistantMessage" in json &&
      typeof json.assistantMessage === "string" &&
      json.assistantMessage.trim()
    ) {
      return {
        assistantMessage: json.assistantMessage.trim(),
        proposedChanges: [],
      };
    }
  } catch (error) {
    console.error("TRIP_CHAT_JSON_PARSE_ERROR", error);
  }

  return {
    assistantMessage: text.trim(),
    proposedChanges: [],
  };
}

function isLikelyChangeRequest(message: string) {
  const normalizedMessage = message.trim().toLowerCase();

  const isAdviceQuestion =
    /^(can|could|should|would)\s+i\b/.test(normalizedMessage) ||
    /^(how|what)\s+(can|could|should|would)\s+i\b/.test(normalizedMessage);

  if (isAdviceQuestion) return false;

  return /\b(add|apply|change|cheaper|delete|include|improve|make|move|reduce|remove|replace|switch|update)\b/i.test(
    message,
  );
}

function buildProposalRepairPrompt({
  originalPrompt,
  previousResponse,
  userMessage,
}: {
  originalPrompt: string;
  previousResponse: string;
  userMessage: string;
}) {
  return `
${originalPrompt}

The previous AI response did not include a valid proposedChanges array for an itinerary change request.

User change request:
${userMessage}

Previous invalid response:
${previousResponse}

Return corrected JSON only.
Because the user is asking to change the itinerary, proposedChanges must contain at least one safe valid change if a matching day or item exists in the context.
If the user is modifying an existing activity, use UPDATE_ACTIVITY with the exact activityId from the context.
Do not return plain text outside JSON.
`;
}

export async function sendTripChatMessageAction(
  input: SendTripChatMessageInput,
): Promise<SendTripChatMessageResult> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        ok: false,
        error: "You must be logged in to chat with Kartografer AI.",
      };
    }

    const parsed = sendTripChatMessageSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid chat message.",
      };
    }

    const { tripId, message } = parsed.data;

    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        userId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        summary: true,
        daysCount: true,
        peopleCount: true,
        budgetAmount: true,
        currency: true,
        tripType: true,
        travelPace: true,
        foodPreference: true,
        transportPreference: true,
        specialNotes: true,
        fromPlace: {
          select: {
            formattedName: true,
            name: true,
          },
        },
        toPlace: {
          select: {
            formattedName: true,
            name: true,
          },
        },
        costBreakdown: {
          select: {
            totalEstimatedCost: true,
            budgetStatus: true,
          },
        },
        days: {
          orderBy: {
            dayNumber: "asc",
          },
          select: {
            id: true,
            dayNumber: true,
            title: true,
            description: true,
            estimatedCost: true,
          },
        },
        transportOptions: {
          where: {
            isSelected: true,
          },
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            tripDayId: true,
            title: true,
            mode: true,
            fromText: true,
            toText: true,
            totalCost: true,
          },
        },
        stayOptions: {
          where: {
            isSelected: true,
          },
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            tripDayId: true,
            name: true,
            area: true,
            city: true,
            stayType: true,
            totalCost: true,
          },
        },
        mealSuggestions: {
          where: {
            isSelected: true,
          },
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            tripDayId: true,
            mealType: true,
            title: true,
            locationName: true,
            estimatedCost: true,
          },
        },
        activities: {
          where: {
            isSelected: true,
          },
          orderBy: {
            position: "asc",
          },
          select: {
            id: true,
            tripDayId: true,
            title: true,
            category: true,
            startTime: true,
            endTime: true,
            estimatedCost: true,
          },
        },
      },
    });

    if (!trip) {
      return {
        ok: false,
        error: "Trip not found.",
      };
    }

    const aiRateLimit = await consumeAiChatLimit({
      userId: session.user.id,
      tripId,
    });

    if (!aiRateLimit.allowed) {
      return {
        ok: false,
        error: getAiRateLimitErrorMessage(aiRateLimit),
      };
    }

    const userMessage = await prisma.tripChatMessage.create({
      data: {
        tripId,
        userId: session.user.id,
        role: "USER",
        content: message,
      },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
        proposedChangesJson: true,
        changeSummary: true,
        status: true,
      },
    });

    const recentMessages = await prisma.tripChatMessage.findMany({
      where: {
        tripId,
        userId: session.user.id,
        id: {
          not: userMessage.id,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
      select: {
        role: true,
        content: true,
      },
    });

    const transportsByDay: SelectedItemByDay = {};
    const staysByDay: SelectedItemByDay = {};
    const mealsByDay: SelectedItemByDay = {};
    const activitiesByDay: SelectedItemByDay = {};

    for (const transport of trip.transportOptions) {
      addItem(transportsByDay, transport.tripDayId, {
        id: transport.id,
        title: [
          transport.title,
          transport.mode,
          transport.fromText && transport.toText
            ? `${transport.fromText} to ${transport.toText}`
            : null,
          formatCost("cost", transport.totalCost),
        ]
          .filter(Boolean)
          .join(" | "),
      });
    }

    for (const stay of trip.stayOptions) {
      addItem(staysByDay, stay.tripDayId, {
        id: stay.id,
        title: [
          stay.name,
          stay.area ?? stay.city,
          stay.stayType,
          formatCost("cost", stay.totalCost),
        ]
          .filter(Boolean)
          .join(" | "),
      });
    }

    for (const meal of trip.mealSuggestions) {
      addItem(mealsByDay, meal.tripDayId, {
        id: meal.id,
        title: [
          meal.mealType,
          meal.title,
          meal.locationName,
          formatCost("cost", meal.estimatedCost),
        ]
          .filter(Boolean)
          .join(" | "),
      });
    }

    for (const activity of trip.activities) {
      addItem(activitiesByDay, activity.tripDayId, {
        id: activity.id,
        title: [
          activity.startTime && activity.endTime
            ? `${activity.startTime}-${activity.endTime}`
            : null,
          activity.title,
          activity.category,
          formatCost("cost", activity.estimatedCost),
        ]
          .filter(Boolean)
          .join(" | "),
      });
    }

    const prompt = buildTripChatPrompt({
      trip: {
        title: trip.title,
        summary: trip.summary,
        daysCount: trip.daysCount,
        peopleCount: trip.peopleCount,
        budgetAmount: getNumberText(trip.budgetAmount),
        currency: trip.currency,
        tripType: trip.tripType,
        travelPace: trip.travelPace,
        foodPreference: trip.foodPreference,
        transportPreference: trip.transportPreference,
        specialNotes: trip.specialNotes,
        fromPlace:
          trip.fromPlace?.formattedName ?? trip.fromPlace?.name ?? "Not set",
        toPlace: trip.toPlace?.formattedName ?? trip.toPlace?.name ?? "Not set",
        totalEstimatedCost: getNumberText(
          trip.costBreakdown?.totalEstimatedCost,
        ),
        budgetStatus: trip.costBreakdown?.budgetStatus ?? null,
        days: trip.days.map((day) => ({
          id: day.id,
          dayNumber: day.dayNumber,
          title: day.title,
          description: day.description,
          estimatedCost: getNumberText(day.estimatedCost),
          transports: transportsByDay[day.id] ?? [],
          stays: staysByDay[day.id] ?? [],
          meals: mealsByDay[day.id] ?? [],
          activities: activitiesByDay[day.id] ?? [],
        })),
      },
      recentMessages: recentMessages.reverse(),
      userMessage: message,
    });

    let assistantContent = "";
    let proposedChanges: TripAiChange[] = [];
    const shouldRequireProposal = isLikelyChangeRequest(message);

    try {
      const aiResult = await generateTextWithGemini({
        prompt,
      });

      const parsedAiResponse = parseAiChatResponse(aiResult.text);

      assistantContent = parsedAiResponse.assistantMessage.trim();
      proposedChanges = parsedAiResponse.proposedChanges;

      if (shouldRequireProposal && proposedChanges.length === 0) {
        const repairResult = await generateTextWithGemini({
          prompt: buildProposalRepairPrompt({
            originalPrompt: prompt,
            previousResponse: aiResult.text,
            userMessage: message,
          }),
        });
        const repairedResponse = parseAiChatResponse(repairResult.text);

        assistantContent = repairedResponse.assistantMessage.trim();
        proposedChanges = repairedResponse.proposedChanges;
      }
    } catch (aiError) {
      console.error("TRIP_CHAT_AI_ERROR", aiError);

      return {
        ok: false,
        error: getRetryAiErrorMessage(aiError),
      };
    }

    if (!assistantContent) {
      return {
        ok: false,
        error: "Kartografer AI returned an empty response. Please try again.",
      };
    }

    const assistantMessage = await prisma.tripChatMessage.create({
      data: {
        tripId,
        userId: session.user.id,
        role: "ASSISTANT",
        content: assistantContent,
        proposedChangesJson:
          proposedChanges.length > 0 ? proposedChanges : undefined,
        changeSummary:
          proposedChanges.length > 0
            ? proposedChanges.map((change) => change.label).join("\n")
            : undefined,
        status: proposedChanges.length > 0 ? "PENDING" : "NONE",
      },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
        proposedChangesJson: true,
        changeSummary: true,
        status: true,
      },
    });

    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard/settings");

    return {
      ok: true,
      userMessage: toMessageDto(userMessage),
      assistantMessage: toMessageDto(assistantMessage),
      error: null,
    };
  } catch (error) {
    console.error("SEND_TRIP_CHAT_MESSAGE_ERROR", error);

    return {
      ok: false,
      error: "Something went wrong while sending your message.",
    };
  }
}
