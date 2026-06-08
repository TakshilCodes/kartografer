import type { ReactNode } from "react";
import { Bot, Route, Sparkles } from "lucide-react";

type MobileEditorFooterProps = {
  activePanel: "options" | "ai" | null;
  onOpenOptions: () => void;
  onShowPlan: () => void;
  onOpenAi: () => void;
};

function FooterButton({
  label,
  icon,
  isActive,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-2 py-2 transition active:scale-95"
    >
      <span
        className={`flex h-6 w-6 items-center justify-center transition ${
          isActive ? "text-primary" : "text-secondary-foreground"
        }`}
      >
        {icon}
      </span>

      <span
        className={`truncate text-[11px] font-bold leading-none ${
          isActive ? "text-primary" : "text-secondary-foreground"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

export default function MobileEditorFooter({
  activePanel,
  onOpenOptions,
  onShowPlan,
  onOpenAi,
}: MobileEditorFooterProps) {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card shadow-[0_-6px_24px_rgba(31,20,8,0.08)] xl:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        <FooterButton
          label="Options"
          icon={<Sparkles className="h-5 w-5" />}
          isActive={activePanel === "options"}
          onClick={onOpenOptions}
        />

        <FooterButton
          label="Plan"
          icon={<Route className="h-5 w-5" />}
          isActive={activePanel === null}
          onClick={onShowPlan}
        />

        <FooterButton
          label="AI Chat"
          icon={<Bot className="h-5 w-5" />}
          isActive={activePanel === "ai"}
          onClick={onOpenAi}
        />
      </div>

      <div className="mx-auto mb-1 h-1 w-16 rounded-full bg-foreground/30" />
    </footer>
  );
}