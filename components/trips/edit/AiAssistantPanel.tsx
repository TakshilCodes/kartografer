"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  XCircle,
} from "lucide-react";

import { applyAiTripChangesAction } from "@/actions/trips/apply-ai-trip-changes.action";
import { dismissAiTripChangesAction } from "@/actions/trips/dismiss-ai-trip-changes.action";
import {
  sendTripChatMessageAction,
  type ChatMessageDto,
} from "@/actions/trips/send-trip-chat-message.action";

const examplePrompts = [
  "Make Day 1 cheaper",
  "Add hidden gems near Dal Lake",
  "Make this day more relaxed",
  "Suggest better vegetarian meals",
];

type AiChatContentProps = {
  tripId: string;
  initialMessages: ChatMessageDto[];
};

function getActionErrorMessage(error: unknown) {
  if (!error) return "Something went wrong. Please try again.";

  if (typeof error === "string") return error;

  return "Something went wrong. Please try again.";
}

function EmptyAssistantState() {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl bg-dashboard px-3 py-2 text-sm leading-6 text-secondary-foreground">
        I can help you improve this itinerary, reduce cost, add hidden spots,
        or make the trip more relaxed. I will suggest changes only for now.
      </div>
    </div>
  );
}

export function AiChatContent({
  tripId,
  initialMessages,
}: AiChatContentProps) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingProposalId, setPendingProposalId] = useState<string | null>(
    null
  );
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({
      block: "end",
    });
  }, [messages, isPending, error]);

  function sendMessage(messageText: string) {
    const trimmedMessage = messageText.trim();

    if (!trimmedMessage || isPending) return;

    setError(null);
    setInput("");

    startTransition(async () => {
      const result = await sendTripChatMessageAction({
        tripId,
        message: trimmedMessage,
      });

      if (!result.ok) {
        setError(getActionErrorMessage(result.error));
        setInput(trimmedMessage);
        return;
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        result.userMessage,
        result.assistantMessage,
      ]);
    });
  }

  function updateProposalStatus(
    proposalId: string,
    status: "applied" | "dismissed"
  ) {
    setMessages((currentMessages) => {
      return currentMessages.map((message) => {
        if (message.proposal?.id !== proposalId) return message;

        return {
          ...message,
          proposal: {
            ...message.proposal,
            status,
          },
        };
      });
    });
  }

  async function handleApplyProposal(proposalId: string) {
    setError(null);
    setPendingProposalId(proposalId);

    const result = await applyAiTripChangesAction({
      proposalId,
    });

    setPendingProposalId(null);

    if (!result.ok) {
      setError(getActionErrorMessage(result.error));
      return;
    }

    updateProposalStatus(proposalId, "applied");
    router.refresh();
  }

  async function handleDismissProposal(proposalId: string) {
    setError(null);
    setPendingProposalId(proposalId);

    const result = await dismissAiTripChangesAction({
      proposalId,
    });

    setPendingProposalId(null);

    if (!result.ok) {
      setError(getActionErrorMessage(result.error));
      return;
    }

    updateProposalStatus(proposalId, "dismissed");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(input);
  }

  return (
    <>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 scrollbar-none [&::-webkit-scrollbar]:hidden">
        {messages.length === 0 ? <EmptyAssistantState /> : null}

        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            <div
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-6 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-dashboard text-secondary-foreground"
                }`}
              >
                {message.content}
              </div>
            </div>

            {message.proposal ? (
              <div className="flex justify-start">
                <div className="w-full rounded-2xl border border-border bg-card-secondary/50 p-3">
                  <div className="mb-3 flex items-start gap-2">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-foreground">
                        Suggested changes
                      </p>

                      {message.proposal.summary ? (
                        <p className="mt-1 text-xs font-semibold leading-5 text-secondary-foreground">
                          {message.proposal.summary}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {message.proposal.changes.map((change, index) => (
                      <div
                        key={`${message.proposal?.id}-${change.type}-${index}`}
                        className="rounded-xl bg-card px-3 py-2"
                      >
                        <p className="text-xs font-black text-foreground">
                          {change.label}
                        </p>
                        <p className="mt-1 text-xs font-semibold leading-5 text-secondary-foreground">
                          {change.reason}
                        </p>
                      </div>
                    ))}
                  </div>

                  {message.proposal.status === "pending" ? (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        disabled={pendingProposalId !== null}
                        onClick={() => handleApplyProposal(message.proposal!.id)}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-black text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pendingProposalId === message.proposal.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        Apply changes
                      </button>

                      <button
                        type="button"
                        disabled={pendingProposalId !== null}
                        onClick={() =>
                          handleDismissProposal(message.proposal!.id)
                        }
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-black text-secondary-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Dismiss
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-card px-3 py-2 text-xs font-black text-secondary-foreground">
                      {message.proposal.status === "applied" ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                          Applied
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5 text-secondary-foreground" />
                          Dismissed
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ))}

        {isPending ? (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-dashboard px-3 py-2 text-sm font-bold text-secondary-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Thinking...
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-danger/25 bg-danger/10 px-3 py-2 text-sm font-bold text-danger">
            {error}
          </div>
        ) : null}

        {messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card-secondary/40 p-3">
            <div className="mb-2 flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              <p className="text-xs font-black text-foreground">
                Example prompts
              </p>
            </div>

            <div className="space-y-2">
              {examplePrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={isPending}
                  onClick={() => setInput(prompt)}
                  className="block w-full cursor-pointer rounded-xl bg-card px-3 py-2 text-left text-xs font-bold text-secondary-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSubmit} className="shrink-0 border-t border-border bg-card p-3">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-dashboard px-3 py-2">
          <input
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setError(null);
            }}
            disabled={isPending}
            placeholder="Ask AI to improve this trip..."
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-secondary-foreground disabled:opacity-70"
          />

          <button
            type="submit"
            disabled={isPending || !input.trim()}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </form>
    </>
  );
}

export default function AiAssistantPanel({
  tripId,
  initialMessages,
}: AiChatContentProps) {
  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[26px] border border-border bg-card shadow-sm">
      <div className="shrink-0 border-b border-border bg-card-secondary/50 px-4 py-4">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <div>
            <h2 className="text-sm font-black text-foreground">
              AI Assistant
            </h2>
            <p className="text-xs font-semibold text-secondary-foreground">
              Ask for suggestions. Applying changes comes later.
            </p>
          </div>
        </div>
      </div>

      <AiChatContent tripId={tripId} initialMessages={initialMessages} />
    </section>
  );
}

export type { ChatMessageDto };
