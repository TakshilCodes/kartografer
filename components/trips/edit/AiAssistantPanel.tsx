"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bot,
  CheckCircle2,
  Loader2,
  MessageCircle,
  PanelRightClose,
  PanelRightOpen,
  Send,
  Sparkles,
  Wand2,
  XCircle,
} from "lucide-react";

import { applyAiTripChangesAction } from "@/actions/trips/apply-ai-trip-changes.action";
import { dismissAiTripChangesAction } from "@/actions/trips/dismiss-ai-trip-changes.action";
import {
  sendTripChatMessageAction,
  type ChatMessageDto,
} from "@/actions/trips/send-trip-chat-message.action";

const AI_PANEL_DEFAULT_WIDTH = 400;
const AI_PANEL_MIN_WIDTH = 340;
const AI_PANEL_MAX_WIDTH = 1400;
const AI_PANEL_COLLAPSE_WIDTH = 300;
const AI_PANEL_COLLAPSED_WIDTH = 52;

const examplePrompts = [
  "Make this day cheaper",
  "Suggest hidden spots",
  "Improve pacing",
  "Better vegetarian meals",
  "Add a local experience",
];

type AiChatContentProps = {
  tripId: string;
  initialMessages: ChatMessageDto[];
};

type AiAssistantPanelProps = AiChatContentProps & {
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
  panelWidth?: number;
  minPanelWidth?: number;
  maxPanelWidth?: number;
  onPanelWidthChange?: (width: number) => void;
  onPanelResizeStateChange?: (isResizing: boolean) => void;
};

function getActionErrorMessage(error: unknown) {
  if (!error) return "Something went wrong. Please try again.";
  if (typeof error === "string") return error;

  return "Something went wrong. Please try again.";
}

function isUserMessage(message: ChatMessageDto) {
  return message.role.toLowerCase() === "user";
}

function cleanAssistantMessage(content: string) {
  return content
    .replace(/^As Kartografer AI Assistant,\s*/i, "")
    .replace(/^As your Kartografer AI Assistant,\s*/i, "")
    .replace(/^As an AI travel assistant,\s*/i, "")
    .trim();
}

function EmptyAssistantState() {
  return (
    <div className="flex min-h-65 flex-col items-center justify-center px-5 py-8 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
        <Sparkles className="h-6 w-6" />
      </div>

      <h3 className="text-sm font-black text-foreground">
        Improve this trip with AI
      </h3>

      <p className="mt-2 max-w-70 text-sm font-medium leading-6 text-secondary-foreground">
        Ask for cheaper options, hidden spots, better pacing, food ideas, or
        small itinerary edits.
      </p>

      <div className="mt-4 rounded-full border border-border bg-card-secondary px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-secondary-foreground">
        Review before applying
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="flex items-end gap-2"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
        <Bot className="h-3.5 w-3.5" />
      </div>

      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-border bg-card-secondary px-4 py-3 shadow-sm">
        {[0, 1, 2].map((dot) => (
          <motion.span
            key={dot}
            className="h-1.5 w-1.5 rounded-full bg-secondary-foreground"
            animate={{
              opacity: [0.35, 1, 0.35],
              scale: [0.82, 1, 0.82],
              y: [0, -2, 0],
            }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              ease: "easeInOut",
              delay: dot * 0.14,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function MessageBubble({ message }: { message: ChatMessageDto }) {
  const userMessage = isUserMessage(message);
  const content = userMessage
    ? message.content
    : cleanAssistantMessage(message.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={`flex items-end gap-2 ${userMessage ? "justify-end" : "justify-start"
        }`}
    >
      {!userMessage ? (
        <div className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
          <Bot className="h-3.5 w-3.5" />
        </div>
      ) : null}

      <div
        className={`max-w-[86%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${userMessage
          ? "rounded-br-md bg-primary text-primary-foreground"
          : "rounded-bl-md border border-border bg-card-secondary text-foreground"
          }`}
      >
        {content}
      </div>
    </motion.div>
  );
}

function ProposalCard({
  message,
  pendingProposalId,
  onApply,
  onDismiss,
}: {
  message: ChatMessageDto;
  pendingProposalId: string | null;
  onApply: (proposalId: string) => void;
  onDismiss: (proposalId: string) => void;
}) {
  if (!message.proposal) return null;

  const proposal = message.proposal;
  const isPendingProposal = pendingProposalId === proposal.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="ml-9 rounded-2xl border border-primary/15 bg-primary/5 p-3 shadow-sm"
    >
      <div className="mb-3 flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Wand2 className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-foreground">
              Suggested changes
            </p>

            <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-secondary-foreground">
              Review first
            </span>
          </div>

          {proposal.summary ? (
            <p className="mt-1.5 text-xs font-semibold leading-5 text-secondary-foreground">
              {proposal.summary}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        {proposal.changes.map((change, index) => (
          <div
            key={`${proposal.id}-${change.type}-${index}`}
            className="rounded-xl border border-border bg-card px-3 py-2.5"
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-full bg-card-secondary px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-secondary-foreground">
                {change.type.replaceAll("_", " ")}
              </span>
            </div>

            <p className="text-xs font-black leading-5 text-foreground">
              {change.label}
            </p>

            <p className="mt-1 text-xs font-semibold leading-5 text-secondary-foreground">
              {change.reason}
            </p>
          </div>
        ))}
      </div>

      {proposal.status === "pending" ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={pendingProposalId !== null}
            onClick={() => onApply(proposal.id)}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-xs font-black text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPendingProposal ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            Apply
          </button>

          <button
            type="button"
            disabled={pendingProposalId !== null}
            onClick={() => onDismiss(proposal.id)}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-black text-secondary-foreground transition hover:bg-card-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            <XCircle className="h-3.5 w-3.5" />
            Dismiss
          </button>
        </div>
      ) : (
        <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-black text-secondary-foreground">
          {proposal.status === "applied" ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              Applied
            </>
          ) : (
            <>
              <XCircle className="h-3.5 w-3.5" />
              Dismissed
            </>
          )}
        </div>
      )}
    </motion.div>
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
    null,
  );
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);

  function handleScroll() {
    const element = scrollContainerRef.current;

    if (!element) return;

    const distanceFromTop = element.scrollTop;
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;

    setIsAtTop(distanceFromTop < 8);
    setIsAtBottom(distanceFromBottom < 8);
  }

  function resizeInput() {
    const element = inputRef.current;

    if (!element) return;

    element.style.height = "0px";
    element.style.height = `${Math.min(element.scrollHeight, 120)}px`;
  }

  useEffect(() => {
    scrollRef.current?.scrollIntoView({
      block: "end",
    });
  }, [messages, isPending, error]);

  useEffect(() => {
    handleScroll();
  }, [messages]);

  useEffect(() => {
    resizeInput();
  }, [input]);

  function sendMessage(messageText: string) {
    const trimmedMessage = messageText.trim();

    if (!trimmedMessage || isPending) return;

    const optimisticMessageId = `pending-user-${Date.now()}`;
    const optimisticUserMessage: ChatMessageDto = {
      id: optimisticMessageId,
      role: "user",
      content: trimmedMessage,
      createdAt: new Date().toISOString(),
      proposal: null,
    };

    setError(null);
    setInput("");
    setMessages((currentMessages) => [
      ...currentMessages,
      optimisticUserMessage,
    ]);

    startTransition(async () => {
      const result = await sendTripChatMessageAction({
        tripId,
        message: trimmedMessage,
      });

      if (!result.ok) {
        setMessages((currentMessages) =>
          currentMessages.filter(
            (message) => message.id !== optimisticMessageId,
          ),
        );
        setError(getActionErrorMessage(result.error));
        setInput(trimmedMessage);
        return;
      }

      setMessages((currentMessages) => [
        ...currentMessages.map((message) =>
          message.id === optimisticMessageId ? result.userMessage : message,
        ),
        result.assistantMessage,
      ]);
    });
  }

  function updateProposalStatus(
    proposalId: string,
    status: "applied" | "dismissed",
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(input);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;

    event.preventDefault();
    sendMessage(input);
  }

  return (
    <>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {!isAtTop ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-6 bg-linear-to-b from-card to-transparent" />
        ) : null}

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto px-3 py-4 scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          <div className="space-y-4">
            {messages.length === 0 ? <EmptyAssistantState /> : null}

            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                <MessageBubble message={message} />

                <ProposalCard
                  message={message}
                  pendingProposalId={pendingProposalId}
                  onApply={handleApplyProposal}
                  onDismiss={handleDismissProposal}
                />
              </div>
            ))}

            {isPending ? <TypingIndicator /> : null}

            {error ? (
              <div className="rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm font-bold leading-6 text-danger">
                {error}
              </div>
            ) : null}

            {messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card-secondary/35 p-3 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-foreground">
                    Try asking
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {examplePrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      disabled={isPending}
                      onClick={() => setInput(prompt)}
                      className="cursor-pointer rounded-full border border-border bg-card px-3 py-1.5 text-left text-xs font-bold text-secondary-foreground transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card-hover hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div ref={scrollRef} />
          </div>
        </div>

        {!isAtBottom ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-6 bg-linear-to-t from-card to-transparent" />
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-border bg-card/95 p-3"
      >
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-primary">
            <CheckCircle2 className="h-3 w-3" />
            Safe apply
          </span>

          <span className="text-[11px] font-semibold text-secondary-foreground">
            Review suggestions before applying
          </span>
        </div>

        <div className="flex items-end gap-2 rounded-2xl border border-border bg-dashboard px-3 py-2.5 transition focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setError(null);
            }}
            onKeyDown={handleInputKeyDown}
            rows={1}
            disabled={isPending}
            placeholder="Ask AI to improve this trip..."
            className="max-h-30 min-h-9 min-w-0 flex-1 resize-none bg-transparent py-2 text-sm leading-5 text-foreground outline-none placeholder:text-secondary-foreground disabled:opacity-70"
          />

          <button
            type="submit"
            disabled={isPending || !input.trim()}
            aria-label="Send AI message"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
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
  isCollapsed = false,
  onToggleCollapsed,
  panelWidth = AI_PANEL_DEFAULT_WIDTH,
  minPanelWidth = AI_PANEL_MIN_WIDTH,
  maxPanelWidth = AI_PANEL_MAX_WIDTH,
  onPanelWidthChange,
  onPanelResizeStateChange,
}: AiAssistantPanelProps) {
  const messageCount = initialMessages.length;
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(panelWidth);

  const clampedPanelWidth = Math.min(
    Math.max(panelWidth, minPanelWidth),
    maxPanelWidth,
  );

  function handleResizePointerDown(
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    if (isCollapsed) return;

    event.preventDefault();

    resizeStartXRef.current = event.clientX;
    resizeStartWidthRef.current = clampedPanelWidth;
    setIsResizing(true);
    onPanelResizeStateChange?.(true);

    const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
      moveEvent.preventDefault();

      const dragDistance = resizeStartXRef.current - moveEvent.clientX;
      const nextWidth = resizeStartWidthRef.current + dragDistance;

      if (nextWidth <= AI_PANEL_COLLAPSE_WIDTH) {
        setIsResizing(false);
        onPanelResizeStateChange?.(false);

        document.body.style.cursor = "";
        document.body.style.userSelect = "";

        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);

        onToggleCollapsed?.();
        return;
      }

      const nextClampedWidth = Math.min(
        Math.max(nextWidth, minPanelWidth),
        maxPanelWidth,
      );

      onPanelWidthChange?.(nextClampedWidth);
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      onPanelResizeStateChange?.(false);

      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  if (isCollapsed) {
    return (
      <motion.section
        initial={{ opacity: 0, width: AI_PANEL_COLLAPSED_WIDTH, x: 12 }}
        animate={{ opacity: 1, width: AI_PANEL_COLLAPSED_WIDTH, x: 0 }}
        exit={{ opacity: 0, width: AI_PANEL_COLLAPSED_WIDTH, x: 12 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        style={{
          width: AI_PANEL_COLLAPSED_WIDTH,
          minWidth: AI_PANEL_COLLAPSED_WIDTH,
          flexBasis: AI_PANEL_COLLAPSED_WIDTH,
        }}
        className="flex h-full min-h-0 flex-col items-center overflow-hidden rounded-3xl border border-border bg-card/95 px-1.5 py-3 shadow-sm"
      >
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label="Open AI Assistant"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-2xl border border-border bg-card-secondary text-primary transition hover:border-primary/30 hover:bg-card-hover"
        >
          <PanelRightOpen className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onToggleCollapsed}
          className="group mt-4 flex flex-1 cursor-pointer items-center justify-center rounded-full px-1 py-3 transition"
          aria-label="Open AI Assistant"
        >
          <div className="flex items-center gap-2 [writing-mode:vertical-rl]">
            <Bot className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">
              AI Assistant
            </span>
          </div>
        </button>

        <div className="mt-3 flex h-7 min-w-7 items-center justify-center rounded-full bg-primary/10 px-2 text-[11px] font-black text-primary">
          {messageCount > 99 ? "99+" : messageCount}
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, x: 20 }}
      animate={{
        opacity: 1,
        x: 0,
        width: clampedPanelWidth,
      }}
      transition={{
        opacity: { duration: 0.18 },
        x: { duration: 0.22, ease: "easeOut" },
        width: {
          duration: isResizing ? 0 : 0.16,
          ease: "easeOut",
        },
      }}
      style={{
        width: clampedPanelWidth,
        minWidth: clampedPanelWidth,
        flexBasis: clampedPanelWidth,
        maxWidth: "calc(100vw - 24px)",
      }}
      className={`relative flex h-full min-h-0 shrink-0 flex-col overflow-hidden rounded-[28px] border border-border bg-card shadow-sm transition-[border-color,box-shadow] duration-150 ${isResizing ? "border-primary/40 shadow-lg shadow-primary/10" : ""
        }`}
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize AI Assistant panel"
        title="Drag to resize AI Assistant"
        onPointerDown={handleResizePointerDown}
        className="group absolute -left-2 top-0 z-30 flex h-full w-5 cursor-ew-resize touch-none items-center justify-center"
      >
        <motion.div
          animate={{
            opacity: isResizing ? 1 : 0.34,
          }}
          whileHover={{
            opacity: 1,
          }}
          transition={{ duration: 0.14 }}
          className="pointer-events-none absolute inset-y-7 left-1/2 w-px -translate-x-1/2 rounded-full bg-border/80 transition-colors group-hover:bg-primary/45"
        />
        <motion.div
          animate={{
            opacity: isResizing ? 1 : 0.72,
            scale: isResizing ? 1.04 : 1,
          }}
          whileHover={{
            opacity: 1,
            scale: 1.04,
          }}
          transition={{ duration: 0.14 }}
          className="pointer-events-none absolute left-1/2 top-1/2 flex h-16 w-3 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-full border border-border bg-card shadow-sm transition-colors group-hover:border-primary/40 group-hover:bg-card-hover"
        >
          <span className="h-1 w-1 rounded-full bg-secondary-foreground/70 transition-colors group-hover:bg-primary" />
          <span className="h-1 w-1 rounded-full bg-secondary-foreground/70 transition-colors group-hover:bg-primary" />
          <span className="h-1 w-1 rounded-full bg-secondary-foreground/70 transition-colors group-hover:bg-primary" />
        </motion.div>
      </div>
      <div className="shrink-0 border-b border-border bg-card-secondary/45 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
              <Bot className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-sm font-black text-foreground">
                  AI Travel Assistant
                </h2>

                <span className="hidden rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-primary sm:inline-flex">
                  Beta
                </span>
              </div>

              <p className="mt-0.5 line-clamp-2 text-xs font-semibold leading-5 text-secondary-foreground">
                Ask for ideas, fixes, and small trip improvements.
              </p>
            </div>
          </div>

          {onToggleCollapsed ? (
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label="Collapse AI Assistant"
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-secondary-foreground transition hover:border-primary/30 hover:bg-card-hover hover:text-foreground"
            >
              <PanelRightClose className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <AiChatContent tripId={tripId} initialMessages={initialMessages} />
    </motion.section>
  );
}

export type { ChatMessageDto };
