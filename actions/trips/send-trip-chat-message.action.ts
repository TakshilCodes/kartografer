"use server";

import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { getRetryAiErrorMessage } from "@/lib/ai/ai-error-details";
import { generateTextWithGemini } from "@/lib/ai/gemini.provider";
import { buildTripChatPrompt } from "@/lib/ai/prompts/trip-chat.prompt";
import prisma from "@/lib/prisma";

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

type SelectedItemByDay = Record<string, string[]>;

function toMessageDto(message: {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  createdAt: Date;
}): ChatMessageDto {
  return {
    id: message.id,
    role: message.role === "USER" ? "user" : "assistant",
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  };
}

function getNumberText(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const numberValue = Number(value);

  return Number.isNaN(numberValue) ? null : numberValue.toString();
}

function addItem(map: SelectedItemByDay, tripDayId: string | null, value: string) {
  if (!tripDayId) return;

  map[tripDayId] = [...(map[tripDayId] ?? []), value];
}

function formatCost(label: string, value: unknown) {
  const cost = getNumberText(value);

  return cost ? `${label}: ${cost}` : null;
}

export async function sendTripChatMessageAction(
  input: SendTripChatMessageInput
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
      addItem(
        transportsByDay,
        transport.tripDayId,
        [
          transport.title,
          transport.mode,
          transport.fromText && transport.toText
            ? `${transport.fromText} to ${transport.toText}`
            : null,
          formatCost("cost", transport.totalCost),
        ]
          .filter(Boolean)
          .join(" | ")
      );
    }

    for (const stay of trip.stayOptions) {
      addItem(
        staysByDay,
        stay.tripDayId,
        [
          stay.name,
          stay.area ?? stay.city,
          stay.stayType,
          formatCost("cost", stay.totalCost),
        ]
          .filter(Boolean)
          .join(" | ")
      );
    }

    for (const meal of trip.mealSuggestions) {
      addItem(
        mealsByDay,
        meal.tripDayId,
        [
          meal.mealType,
          meal.title,
          meal.locationName,
          formatCost("cost", meal.estimatedCost),
        ]
          .filter(Boolean)
          .join(" | ")
      );
    }

    for (const activity of trip.activities) {
      addItem(
        activitiesByDay,
        activity.tripDayId,
        [
          activity.startTime && activity.endTime
            ? `${activity.startTime}-${activity.endTime}`
            : null,
          activity.title,
          activity.category,
          formatCost("cost", activity.estimatedCost),
        ]
          .filter(Boolean)
          .join(" | ")
      );
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
          trip.costBreakdown?.totalEstimatedCost
        ),
        budgetStatus: trip.costBreakdown?.budgetStatus ?? null,
        days: trip.days.map((day) => ({
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

    try {
      const aiResult = await generateTextWithGemini({
        prompt,
      });

      assistantContent = aiResult.text.trim();
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
      },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

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
