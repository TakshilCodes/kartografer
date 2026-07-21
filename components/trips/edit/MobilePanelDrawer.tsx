import type { ReactNode } from "react";
import { X } from "lucide-react";

type MobilePanelDrawerProps = {
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
};

export default function MobilePanelDrawer({
  title,
  description,
  children,
  onClose,
}: MobilePanelDrawerProps) {
  return (
    <div className="fixed inset-0 z-50 xl:hidden">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
        aria-label="Close panel"
      />

      <div className="absolute inset-x-0 bottom-0 max-h-[86vh] overflow-hidden rounded-t-[28px] border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-card-secondary/50 px-4 py-4">
          <div>
            <h2 className="text-sm font-black text-foreground">{title}</h2>
            <p className="mt-0.5 text-xs font-semibold text-secondary-foreground">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:bg-card-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(86vh-73px)] overflow-y-auto p-4 scrollbar-none [&::-webkit-scrollbar]:hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
