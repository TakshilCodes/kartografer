"use client";

import Image from "next/image";
import {
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  useTransition,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  Check,
  Copy,
  Link2,
  Mail,
  Share2,
  Unlink,
  X,
} from "lucide-react";

import {
  disableTripPublicShareAction,
  enableTripPublicShareAction,
} from "@/actions/trips/share-trip.action";

type TriggerElementProps = {
  onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
  "aria-label"?: string;
  title?: string;
};

type TripShareDialogProps = {
  tripId: string;
  tripTitle: string;
  initialEnabled: boolean;
  initialPublicUrl: string | null;
  initialSharedAt: string | null;
  triggerVariant?: "default" | "icon";
  trigger?: ReactNode;
};

type ShareOptionProps = {
  label: string;
  icon: ReactNode;
  onClick: () => void | Promise<void>;
};

function ShareOption({ label, icon, onClick }: ShareOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-20 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-3 text-center transition hover:-translate-y-0.5 hover:border-primary/35 hover:bg-card-secondary/35 hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20"
    >
      <span className="flex h-7 w-7 items-center justify-center text-primary transition group-hover:scale-105">
        {icon}
      </span>
      <span className="text-xs font-black text-foreground">{label}</span>
    </button>
  );
}

async function writeTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await Promise.race([
        navigator.clipboard.writeText(text),
        new Promise<never>((_, reject) => {
          window.setTimeout(
            () => reject(new Error("Clipboard timed out.")),
            1500,
          );
        }),
      ]);

      return;
    } catch {
      // Fall through to the selection-based clipboard fallback.
    }
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";

  document.body.appendChild(textArea);
  textArea.select();

  const copied = document.execCommand("copy");

  document.body.removeChild(textArea);

  if (!copied) {
    throw new Error("Clipboard copy failed.");
  }
}

export default function TripShareDialog({
  tripId,
  tripTitle,
  initialEnabled,
  initialPublicUrl,
  initialSharedAt,
  triggerVariant = "default",
  trigger,
}: TripShareDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [publicUrl, setPublicUrl] = useState(initialPublicUrl);
  const [sharedAt, setSharedAt] = useState(initialSharedAt);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!message && !error) return;

    const timer = window.setTimeout(() => {
      setMessage("");
      setError("");
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [message, error]);

  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, isPending]);

  function clearFeedback() {
    setMessage("");
    setError("");
  }

  function openDialog() {
    clearFeedback();
    setIsOpen(true);
  }

  function renderTrigger() {
    if (trigger && isValidElement(trigger)) {
      const triggerElement = trigger as ReactElement<TriggerElementProps>;
      const originalOnClick = triggerElement.props.onClick;

      return cloneElement(triggerElement, {
        onClick: (event: ReactMouseEvent<HTMLElement>) => {
          originalOnClick?.(event);

          if (event.defaultPrevented) return;

          openDialog();
        },
        "aria-label":
          triggerElement.props["aria-label"] ?? `Share ${tripTitle}`,
        title: triggerElement.props.title ?? "Share trip",
      });
    }

    if (trigger) {
      return (
        <span
          role="button"
          tabIndex={0}
          onClick={openDialog}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openDialog();
            }
          }}
          className="inline-flex"
          aria-label={`Share ${tripTitle}`}
          title="Share trip"
        >
          {trigger}
        </span>
      );
    }

    return (
      <button
        type="button"
        onClick={openDialog}
        className={
          triggerVariant === "icon"
            ? "inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:border-primary/30 hover:bg-card-secondary focus:outline-none focus:ring-4 focus:ring-ring/20"
            : "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-sm font-black text-foreground transition hover:bg-card-secondary"
        }
        aria-label={triggerVariant === "icon" ? `Share ${tripTitle}` : undefined}
        title={triggerVariant === "icon" ? "Share trip" : undefined}
      >
        <Share2 className="h-4 w-4" />
        {triggerVariant === "default" ? "Share" : null}
      </button>
    );
  }

  function handleEnableSharing() {
    clearFeedback();

    startTransition(async () => {
      const result = await enableTripPublicShareAction(tripId);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setIsEnabled(true);
      setPublicUrl(result.publicUrl);
      setSharedAt(new Date().toISOString());
      setMessage("Public link enabled.");
    });
  }

  function handleDisableSharing() {
    clearFeedback();

    startTransition(async () => {
      const result = await disableTripPublicShareAction(tripId);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setIsEnabled(false);
      setMessage("Public sharing disabled.");
    });
  }

  async function copyPublicLink(successMessage = "Public link copied.") {
    if (!publicUrl) return;

    clearFeedback();

    try {
      await writeTextToClipboard(publicUrl);
      setMessage(successMessage);
    } catch {
      setError("Could not copy automatically. Select and copy the link.");
    }
  }

  async function handleNativeShare() {
    if (!publicUrl) return;

    clearFeedback();

    if (!navigator.share) {
      await copyPublicLink(
        "Native sharing is unavailable here, so the link was copied.",
      );
      return;
    }

    try {
      await navigator.share({
        title: tripTitle,
        text: `View my ${tripTitle} itinerary on Kartografer.`,
        url: publicUrl,
      });

      setMessage("Trip shared successfully.");
    } catch (shareError) {
      if (
        shareError instanceof DOMException &&
        shareError.name === "AbortError"
      ) {
        return;
      }

      setError("The share sheet could not be opened. Please try another option.");
    }
  }

  function openShareUrl(url: string) {
    clearFeedback();

    const shareWindow = window.open(url, "_blank", "noopener,noreferrer");

    if (!shareWindow) {
      setError("Your browser blocked the share window. Please allow pop-ups.");
    }
  }

  function handleWhatsAppShare() {
    if (!publicUrl) return;

    const text = `View my ${tripTitle} itinerary on Kartografer: ${publicUrl}`;

    openShareUrl(`https://wa.me/?text=${encodeURIComponent(text)}`);
  }

  function handleXShare() {
    if (!publicUrl) return;

    const text = `View my ${tripTitle} itinerary on Kartografer.`;

    openShareUrl(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        text,
      )}&url=${encodeURIComponent(publicUrl)}`,
    );
  }

  function handleTelegramShare() {
    if (!publicUrl) return;

    const text = `View my ${tripTitle} itinerary on Kartografer.`;

    openShareUrl(
      `https://t.me/share/url?url=${encodeURIComponent(
        publicUrl,
      )}&text=${encodeURIComponent(text)}`,
    );
  }

  function handleEmailShare() {
    if (!publicUrl) return;

    clearFeedback();

    const subject = `Trip itinerary: ${tripTitle}`;
    const body = `Here is my read-only ${tripTitle} itinerary on Kartografer:\n\n${publicUrl}`;

    window.location.href = `mailto:?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  }

  return (
    <>
      {renderTrigger()}

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-9999 flex items-end justify-center bg-foreground/30 p-3 backdrop-blur-sm sm:items-center"
              role="dialog"
              aria-modal="true"
              aria-labelledby="trip-share-dialog-title"
            >
              <button
                type="button"
                onClick={() => !isPending && setIsOpen(false)}
                className="absolute inset-0 cursor-default"
                aria-label="Close public sharing dialog"
              />

              <div className="relative flex max-h-[calc(100vh-1.5rem)] w-full max-w-xl flex-col overflow-hidden rounded-[28px] border border-border bg-card shadow-2xl">
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border bg-card-secondary/50 px-5 py-4">
                  <div className="flex min-w-0 gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Link2 className="h-5 w-5" />
                    </span>

                    <div className="min-w-0">
                      <h2
                        id="trip-share-dialog-title"
                        className="text-base font-black text-foreground"
                      >
                        Public sharing
                      </h2>

                      <p className="mt-1 text-sm leading-6 text-secondary-foreground">
                        Create a read-only public link for this trip.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    disabled={isPending}
                    className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:bg-card-secondary disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Close public sharing dialog"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="custom-scrollbar min-h-0 overflow-y-auto p-5">
                  {isEnabled && publicUrl ? (
                    <div className="space-y-5">
                      <div>
                        <label
                          htmlFor="public-trip-url"
                          className="mb-2 block text-sm font-black text-foreground"
                        >
                          Public link
                        </label>

                        <input
                          id="public-trip-url"
                          value={publicUrl}
                          readOnly
                          onFocus={(event) => event.currentTarget.select()}
                          className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm text-foreground outline-none focus:border-ring focus:ring-4 focus:ring-ring/20"
                        />

                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs leading-5 text-secondary-foreground">
                          <p>Anyone with this link can view, but cannot edit.</p>

                          {sharedAt ? (
                            <p className="shrink-0 text-muted-foreground">
                              Enabled{" "}
                              {new Date(sharedAt).toLocaleDateString("en-IN")}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div>
                        <div className="mb-3">
                          <h3 className="text-sm font-black text-foreground">
                            Share this trip
                          </h3>

                          <p className="mt-0.5 text-xs text-secondary-foreground">
                            Choose where you want to send the public itinerary.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          <ShareOption
                            label="Copy link"
                            onClick={() => copyPublicLink()}
                            icon={
                              <Copy className="h-6 w-6" strokeWidth={1.8} />
                            }
                          />

                          <ShareOption
                            label="Native share"
                            onClick={handleNativeShare}
                            icon={
                              <Share2 className="h-6 w-6" strokeWidth={1.8} />
                            }
                          />

                          <ShareOption
                            label="WhatsApp"
                            onClick={handleWhatsAppShare}
                            icon={
                              <Image
                                src="/social-logos/whatsapp.svg"
                                alt=""
                                width={25}
                                height={25}
                              />
                            }
                          />

                          <ShareOption
                            label="X / Twitter"
                            onClick={handleXShare}
                            icon={
                              <Image
                                src="/social-logos/x.svg"
                                alt=""
                                width={23}
                                height={23}
                              />
                            }
                          />

                          <ShareOption
                            label="Telegram"
                            onClick={handleTelegramShare}
                            icon={
                              <Image
                                src="/social-logos/telegram.svg"
                                alt=""
                                width={25}
                                height={25}
                              />
                            }
                          />

                          <ShareOption
                            label="Email"
                            onClick={handleEmailShare}
                            icon={
                              <Mail className="h-6 w-6" strokeWidth={1.8} />
                            }
                          />
                        </div>
                      </div>

                      <div className="border-t border-border pt-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-black text-foreground">
                              Turn off public access
                            </p>

                            <p className="mt-0.5 text-xs leading-5 text-secondary-foreground">
                              The saved URL will stop working until you enable
                              it again.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={handleDisableSharing}
                            disabled={isPending}
                            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-danger/30 bg-card px-4 py-2.5 text-sm font-black text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Unlink className="h-4 w-4" />
                            {isPending ? "Disabling..." : "Disable link"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="rounded-2xl border border-border bg-card-secondary/40 p-4">
                        <p className="text-sm font-black text-foreground">
                          Share the final itinerary safely
                        </p>

                        <p className="mt-1 text-sm leading-6 text-secondary-foreground">
                          Only selected transport, stays, meals, activities,
                          hidden spots, and the trip cost summary will be
                          visible.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleEnableSharing}
                        disabled={isPending}
                        className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-black text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Share2 className="h-4 w-4" />
                        {isPending ? "Enabling..." : "Enable public link"}
                      </button>
                    </div>
                  )}

                  {message ? (
                    <div className="mt-4 flex items-center gap-2 rounded-2xl border border-success/25 bg-success/10 px-4 py-3 text-sm font-bold text-success">
                      <Check className="h-4 w-4 shrink-0" />
                      {message}
                    </div>
                  ) : null}

                  {error ? (
                    <div className="mt-4 rounded-2xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm font-bold text-danger">
                      {error}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}