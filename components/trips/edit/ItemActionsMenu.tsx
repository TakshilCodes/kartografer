"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);


  useEffect(() => {
    if (!isOpen) return;

    function updatePosition() {
      const button = buttonRef.current;

      if (!button) return;

      const rect = button.getBoundingClientRect();
      const menuWidth = 208;
      const viewportPadding = 12;

      let left =
        align === "left"
          ? rect.left
          : rect.right - menuWidth;

      left = Math.max(
        viewportPadding,
        Math.min(left, window.innerWidth - menuWidth - viewportPadding),
      );

      setMenuPosition({
        top: rect.bottom + 8,
        left,
      });
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;

      if (
        !wrapperRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    updatePosition();

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [align, isOpen]);

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

  const portalTarget =
    typeof document !== "undefined"
      ? document.querySelector<HTMLElement>("[data-dashboard-shell]") ??
        document.body
      : null;

  const menu =
    isOpen && portalTarget
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              top: menuPosition.top,
              left: menuPosition.left,
            }}
            className="z-999999 w-52 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-xl"
          >
            {actions.map((action) => {
              const isPending = pendingAction === action.label;

              return (
                <button
                  key={action.label}
                  type="button"
                  role="menuitem"
                  disabled={action.disabled || Boolean(pendingAction)}
                  onClick={() => handleAction(action)}
                  className={`
                    flex w-full cursor-pointer items-center gap-2
                    rounded-xl px-3 py-2
                    text-left text-xs font-bold
                    transition
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                    ${getActionClass(action.variant)}
                  `}
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
          </div>,
          portalTarget,
        )
      : null;

  return (
    <>
      <div ref={wrapperRef} className="relative shrink-0">
        <button
          ref={buttonRef}
          type="button"
          aria-label={label}
          title={label}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
          className="
            flex h-8 w-8 cursor-pointer items-center justify-center
            rounded-full border border-border
            bg-card text-secondary-foreground
            transition
            hover:bg-card-secondary hover:text-primary
          "
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {menu}
    </>
  );
}