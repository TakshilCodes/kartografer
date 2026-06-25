"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MoreHorizontal, X } from "lucide-react";

type TripPreviewActionsMenuProps = {
  children: ReactNode;
};

export default function TripPreviewActionsMenu({
  children,
}: TripPreviewActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current) return;

      if (!menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        aria-label="Open trip actions"
        aria-expanded={isOpen}
        className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:border-primary/30 hover:bg-card-secondary focus:outline-none focus:ring-4 focus:ring-ring/20"
      >
        {isOpen ? (
          <X className="h-4 w-4" />
        ) : (
          <MoreHorizontal className="h-5 w-5" />
        )}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-[22px] border border-border bg-card p-2 shadow-2xl shadow-foreground/10">
          <div className="border-b border-border px-3 py-2">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-secondary-foreground">
              Trip actions
            </p>
          </div>

          <div className="mt-2 space-y-1">{children}</div>
        </div>
      ) : null}
    </div>
  );
}