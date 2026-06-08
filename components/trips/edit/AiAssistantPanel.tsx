import { Bot, MessageCircle, Send } from "lucide-react";

const aiMessages = [
  {
    role: "assistant",
    text: "I can help you improve this itinerary, reduce cost, add hidden spots, or make the trip more relaxed.",
  },
  {
    role: "user",
    text: "Make Day 1 light and family friendly.",
  },
  {
    role: "assistant",
    text: "Day 1 should stay focused on arrival, check-in, Shikara Ride, and a relaxed dinner near Dal Lake.",
  },
];

const examplePrompts = [
  "Make Day 1 cheaper",
  "Add hidden gems near Dal Lake",
  "Make this day more relaxed",
  "Suggest better vegetarian meals",
];

function AiChatContent() {
  return (
    <>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 scrollbar-none [&::-webkit-scrollbar]:hidden">
        {aiMessages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-6 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-dashboard text-secondary-foreground"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}

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
                className="block w-full rounded-xl bg-card px-3 py-2 text-left text-xs font-bold text-secondary-foreground transition hover:bg-secondary"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-card p-3">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-dashboard px-3 py-2">
          <input
            disabled
            placeholder="AI chat backend coming later..."
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-secondary-foreground"
          />

          <button
            disabled
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/60 text-primary-foreground"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}

export default function AiAssistantPanel() {
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
              Static UI for now. Backend later.
            </p>
          </div>
        </div>
      </div>

      <AiChatContent />
    </section>
  );
}

export { AiChatContent };