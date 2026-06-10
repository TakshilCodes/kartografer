"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";

export type ItemAction = {
  label: string;
  icon?: ReactNode;
  variant?: "default" | "primary" | "danger";
  onClick: () => void | boolean | Promise<void | boolean>;
  disabled?: boolean;
};

type ItemActionsMenuProps = {
  actions: ItemAction[];
  label?: string;
  align?: "left" | "right";
};

function getActionClass(variant: ItemAction["variant"] = "default") {
  switch (variant) {
    case "primary":
      return "text-primary hover:bg-card-secondary";
    case "danger":
      return "text-danger hover:bg-danger/10";
    default:
      return "text-foreground hover:bg-card-secondary";
  }
}

export default function ItemActionsMenu({
  actions,
  label = "Open item actions",
  align = "right",
}: ItemActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  async function handleAction(action: ItemAction) {
    if (action.disabled || pendingAction) return;

    setPendingAction(action.label);

    try {
      const result = await action.onClick();

      if (result !== false) {
        setIsOpen(false);
      }
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-secondary-foreground transition hover:bg-card-secondary hover:text-primary"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {isOpen ? (
        <div
          className={`absolute top-full z-40 mt-2 w-52 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-xl ${
            align === "left" ? "left-0" : "right-0"
          }`}
        >
          {actions.map((action) => {
            const isPending = pendingAction === action.label;

            return (
              <button
                key={action.label}
                type="button"
                disabled={action.disabled || Boolean(pendingAction)}
                onClick={() => handleAction(action)}
                className={`flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${getActionClass(
                  action.variant
                )}`}
              >
                {action.icon ? (
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {action.icon}
                  </span>
                ) : null}

                <span className="min-w-0 flex-1">
                  {isPending ? "Working..." : action.label}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
