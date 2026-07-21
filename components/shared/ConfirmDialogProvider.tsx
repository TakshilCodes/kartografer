"use client";

import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

import { useConfirmStore } from "@/stores/use-confirm-store";

function getVariantStyles(variant: "default" | "danger" | "success") {
  if (variant === "danger") {
    return {
      icon: <AlertTriangle className="h-5 w-5" />,
      iconClass: "bg-danger/10 text-danger",
      buttonClass: "bg-danger text-danger-foreground hover:bg-danger-hover",
    };
  }

  if (variant === "success") {
    return {
      icon: <CheckCircle2 className="h-5 w-5" />,
      iconClass: "bg-success/10 text-success",
      buttonClass: "bg-success text-success-foreground hover:bg-success-hover",
    };
  }

  return {
    icon: <Info className="h-5 w-5" />,
    iconClass: "bg-card-secondary text-primary",
    buttonClass: "bg-primary text-primary-foreground hover:bg-primary-hover",
  };
}

export default function ConfirmDialog() {
  const {
    isOpen,
    title,
    description,
    confirmText,
    cancelText,
    variant,
    close,
  } = useConfirmStore();

  if (!isOpen) return null;

  const styles = getVariantStyles(variant ?? "default");

  return (
    <div className="fixed inset-0 z-9999999 flex items-end justify-center p-3 backdrop-blur-sm sm:items-center">
      <button
        type="button"
        onClick={() => close(false)}
        className="absolute inset-0"
        aria-label="Close confirmation dialog"
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border bg-card-secondary/50 px-5 py-4">
          <div className="flex min-w-0 gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${styles.iconClass}`}
            >
              {styles.icon}
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-black text-foreground">{title}</h2>

              {description ? (
                <p className="mt-1 text-sm leading-6 text-secondary-foreground">
                  {description}
                </p>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={() => close(false)}
            className="flex h-9 w-9 shrink-0 items-center justify-center cursor-pointer rounded-full border border-border bg-card text-foreground transition hover:bg-card-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col-reverse gap-2 p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => close(false)}
            className="rounded-full cursor-pointer border border-border bg-card px-5 py-2.5 text-sm font-black text-foreground transition hover:bg-card-secondary"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={() => close(true)}
            className={`rounded-full px-5 py-2.5 text-sm font-black transition cursor-pointer ${styles.buttonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
