"use server";

import type { GenerateContentConfig } from "@google/genai";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { getRetryAiErrorMessage } from "@/lib/ai/ai-error-details";
import { generateTextWithGemini } from "@/lib/ai/gemini.provider";
import {
  buildTripChatPrompt,
  TRIP_CHAT_SYSTEM_INSTRUCTION,
  TRIP_CHAT_TEMPERATURE,
} from "@/lib/ai/prompts/trip-chat.prompt";
import type { TripAiChange } from "@/lib/ai/schemas/trip-ai-change.schema";
import { buildTripChatContext } from "@/lib/ai/trip-chat/context";
import {
  buildTruthfulAssistantMessage,
  processSemanticTripProposalAttempt,
  createStoredTripChatPayload,
  parseStoredTripChatPayload,
  validateAiTripResponse,
  type ProposalChangeCostPreview,
  type ProposalCostPreview,
  type ProposalResultMetadata,
  type ValidatedRecommendation,
} from "@/lib/ai/trip-chat/proposal";
import {
  addTripChatEditCapabilities,
  buildSemanticProposalRepairPrompt,
  type ParsedTripChatProposal,
} from "@/lib/ai/trip-chat/semantic";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  consumeAiChatLimit,
  getAiRateLimitErrorMessage,
} from "@/lib/rate-limit/ai-rate-limit";

const sendTripChatMessageSchema = z.object({
  tripId: z.string().trim().min(1, "Trip id is required."),
  message: z
    .string()
    .trim()
    .min(1, "Message is required.")
    .max(1200, "Message is too long."),
});

type SendTripChatMessageInput = z.infer<typeof sendTripChatMessageSchema>;

export type AiChangeProposalDto = {
  id: string;
  status: "pending" | "applied" | "dismissed";
  summary: string | null;
  changes: Array<{
    type: TripAiChange["type"];
    label: string;
    reason: string;
    cost: ProposalChangeCostPreview | null;
  }>;
  costPreview: ProposalCostPreview | null;
};

export type ChatMessageDto = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  proposal: AiChangeProposalDto | null;
  result?: ProposalResultMetadata | null;
  recommendations?: ValidatedRecommendation[];
  currency?: string | null;
};

type SendTripChatMessageResult =
  | {
      ok: true;
      userMessage: ChatMessageDto;
      assistantMessage: ChatMessageDto;
      error: null;
    }
  | { ok: false; error: string };

function toMessageDto(message: {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  createdAt: Date;
  proposedChangesJson?: unknown;
  changeSummary?: string | null;
  status?: "NONE" | "PENDING" | "APPLIED" | "DISCARDED";
}): ChatMessageDto {
  const payload = parseStoredTripChatPayload(message.proposedChangesJson);
  const changes = payload?.changes ?? [];
  const status = message.status ?? "NONE";
  return {
    id: message.id,
    role: message.role === "USER" ? "user" : "assistant",
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    result: payload?.result ?? null,
    recommendations: payload?.recommendations ?? [],
    currency: payload?.costPreview?.currency ?? null,
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
            changes: changes.map((change, index) => ({
              type: change.type,
              label: change.label,
              reason: change.reason,
              cost: payload?.costPreview?.changes[index] ?? null,
            })),
            costPreview: payload?.costPreview ?? null,
          }
        : null,
  };
}

const TRIP_CHAT_REQUEST_TIMEOUT_MS = 30_000;

function createTripChatGeminiConfig(
  responseJsonSchema?: Record<string, unknown>,
): GenerateContentConfig {
  return {
    temperature: TRIP_CHAT_TEMPERATURE,
    responseMimeType: "application/json",
    ...(responseJsonSchema
      ? {
          responseJsonSchema:
            responseJsonSchema as GenerateContentConfig["responseJsonSchema"],
        }
      : {}),
    httpOptions: { timeout: TRIP_CHAT_REQUEST_TIMEOUT_MS },
    systemInstruction: TRIP_CHAT_SYSTEM_INSTRUCTION,
  };
}

type GeminiGenerationMetadata = {
  modelUsed?: unknown;
  finishReason?: unknown;
  usage?: unknown;
};

function logProposalAttempt({
  tripId,
  phase,
  responseMode,
  parsed,
  compiledCount,
  validation,
  generation,
}: {
  tripId: string;
  phase: "initial" | "repair";
  responseMode: string;
  parsed: ParsedTripChatProposal;
  compiledCount: number;
  validation: ReturnType<typeof validateAiTripResponse>;
  generation: GeminiGenerationMetadata;
}) {
  if (
    parsed.issues.length === 0 &&
    validation.result.rejectedChangeCount === 0
  ) {
    return;
  }
  console.warn("TRIP_CHAT_PROPOSAL_OUTPUT", {
    tripId,
    phase,
    responseMode,
    modelUsed:
      typeof generation.modelUsed === "string"
        ? generation.modelUsed
        : "unknown",
    finishReason:
      typeof generation.finishReason === "string"
        ? generation.finishReason
        : null,
    outputLength: parsed.outputLength,
    parseIssues: parsed.issues.slice(0, 12),
    semanticEditTypes: parsed.proposal.plan.edits.map((edit) => edit.type),
    compiledCount,
    validChangeCount: validation.result.validChangeCount,
    rejectedChangeCount: validation.result.rejectedChangeCount,
    rejectionReasons: validation.result.rejectionReasons.slice(0, 12),
  });
}

function proposalAttemptScore(
  validation: ReturnType<typeof validateAiTripResponse>,
) {
  return (
    validation.changes.length * 100 +
    validation.recommendations.length * 10 -
    validation.result.rejectionReasons.length
  );
}

function isExtensionOnlyProposal(changes: TripAiChange[]) {
  return (
    changes.length === 1 &&
    (changes[0]?.type === "ADD_DAY" || changes[0]?.type === "UPDATE_DAY")
  );
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
      where: { id: tripId, userId: session.user.id },
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
        fromPlace: { select: { formattedName: true, name: true } },
        toPlace: { select: { formattedName: true, name: true } },
        days: {
          orderBy: { dayNumber: "asc" },
          select: {
            id: true,
            dayNumber: true,
            title: true,
            description: true,
            notes: true,
            estimatedCost: true,
          },
        },
        transportOptions: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            tripDayId: true,
            title: true,
            mode: true,
            fromText: true,
            toText: true,
            description: true,
            costType: true,
            pricePerPerson: true,
            totalCost: true,
            isSelected: true,
            notes: true,
          },
        },
        stayOptions: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            tripDayId: true,
            name: true,
            city: true,
            area: true,
            stayType: true,
            budgetLevel: true,
            pricePerNight: true,
            nights: true,
            totalCost: true,
            isSelected: true,
            bestFor: true,
            notes: true,
          },
        },
        mealSuggestions: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            tripDayId: true,
            mealType: true,
            title: true,
            locationName: true,
            estimatedCost: true,
            isSelected: true,
            notes: true,
          },
        },
        activities: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            tripDayId: true,
            title: true,
            description: true,
            locationName: true,
            address: true,
            startTime: true,
            endTime: true,
            durationMinutes: true,
            category: true,
            estimatedCost: true,
            isSelected: true,
            notes: true,
            position: true,
          },
        },
      },
    });
    if (!trip) return { ok: false, error: "Trip not found." };

    const aiRateLimit = await consumeAiChatLimit({
      userId: session.user.id,
      tripId,
    });
    if (!aiRateLimit.allowed) {
      return { ok: false, error: getAiRateLimitErrorMessage(aiRateLimit) };
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
        id: { not: userMessage.id },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        role: true,
        content: true,
        status: true,
        changeSummary: true,
        proposedChangesJson: true,
      },
    });
    const chronological = recentMessages.reverse();
    const assistantHistory = [...chronological]
      .reverse()
      .filter((item) => item.role === "ASSISTANT");
    const previousAssistant = assistantHistory[0];
    const previousPayload = previousAssistant
      ? parseStoredTripChatPayload(previousAssistant.proposedChangesJson)
      : null;

    const context = addTripChatEditCapabilities(
      buildTripChatContext({
        trip,
        recentConversation: chronological.map((item) => ({
          role: item.role,
          content: item.content,
          proposalStatus: item.status,
          proposalSummary: item.changeSummary,
        })),
      }),
    );

    const previousRecommendations = previousPayload?.recommendations ?? [];
    const prompt = buildTripChatPrompt({
      context,
      userMessage: message,
      previousAssistantState: previousAssistant
        ? {
            content: previousAssistant.content,
            status: previousAssistant.status,
            recommendations: previousRecommendations,
            proposalState: previousPayload
              ? {
                  responseMode: previousPayload.result.responseMode,
                  proposalCreated: previousPayload.result.proposalCreated,
                  validChangeCount: previousPayload.result.validChangeCount,
                  rejectedChangeCount: previousPayload.result.rejectedChangeCount,
                }
              : null,
          }
        : null,
    });
    // Gemini's JSON-schema decoder cannot safely serve the full semantic edit
    // contract. The prompt supplies the contract; TypeScript parses and validates
    // every response afterward, including answer-only responses with empty edits.
    const config = createTripChatGeminiConfig();
    let generation: Awaited<ReturnType<typeof generateTextWithGemini>>;
    try {
      generation = await generateTextWithGemini({
        prompt,
        config,
        maxAttemptsPerModel: 1,
        maxRequests: 2,
      });
    } catch (aiError) {
      console.error("TRIP_CHAT_AI_ERROR", aiError);
      return { ok: false, error: getRetryAiErrorMessage(aiError) };
    }

    const processAttempt = (text: string) =>
      processSemanticTripProposalAttempt({
        text,
        context,
        previousRecommendations,
      });

    let attempt = processAttempt(generation.text);
    logProposalAttempt({
      tripId,
      phase: "initial",
      responseMode: "GEMINI_DECIDES",
      parsed: attempt.parsedProposal,
      compiledCount: attempt.compiled.rawChanges.length,
      validation: attempt.validation,
      generation: generation as GeminiGenerationMetadata,
    });

    const modelTriedToPlan =
      attempt.parsedProposal.proposal.plan.extendTrip !== null ||
      attempt.parsedProposal.proposal.plan.edits.length > 0 ||
      attempt.parsedProposal.rejectedEditReasons.length > 0;
    const extensionOnly = isExtensionOnlyProposal(attempt.validation.changes);

    if (
      modelTriedToPlan &&
      (attempt.validation.changes.length === 0 || extensionOnly)
    ) {
      try {
        const repairGeneration = await generateTextWithGemini({
          prompt: buildSemanticProposalRepairPrompt({
            originalPrompt: prompt,
            rejectionReasons: [
              ...attempt.parsedProposal.issues,
              ...attempt.validation.result.rejectionReasons,
              ...(extensionOnly
                ? [
                    "The proposal only prepared the day extension. Add concrete itinerary edits for that day as well.",
                  ]
                : []),
            ],
            previousPlan: attempt.parsedProposal.proposal.plan,
          }),
          config,
          maxAttemptsPerModel: 1,
          maxRequests: 1,
        });
        const repairedAttempt = processAttempt(repairGeneration.text);
        logProposalAttempt({
          tripId,
          phase: "repair",
          responseMode: "GEMINI_DECIDES",
          parsed: repairedAttempt.parsedProposal,
          compiledCount: repairedAttempt.compiled.rawChanges.length,
          validation: repairedAttempt.validation,
          generation: repairGeneration as GeminiGenerationMetadata,
        });
        if (
          proposalAttemptScore(repairedAttempt.validation) >
          proposalAttemptScore(attempt.validation)
        ) {
          attempt = repairedAttempt;
        }
      } catch (repairError) {
        console.error("TRIP_CHAT_REPAIR_ERROR", repairError);
      }
    }

    const modelMessage = attempt.compiled.modelMessage;
    const validation = attempt.validation;
    const assistantContent = buildTruthfulAssistantMessage({
      modelMessage,
      validation,
      context,
    });
    if (!assistantContent) {
      return {
        ok: false,
        error: "Kartografer AI returned an empty response. Please try again.",
      };
    }

    const payload = createStoredTripChatPayload(validation);
    const assistantMessage = await prisma.tripChatMessage.create({
      data: {
        tripId,
        userId: session.user.id,
        role: "ASSISTANT",
        content: assistantContent,
        proposedChangesJson: payload,
        changeSummary:
          validation.changes.length > 0
            ? validation.changes.map((change) => change.label).join("\n")
            : undefined,
        status: validation.changes.length > 0 ? "PENDING" : "NONE",
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
