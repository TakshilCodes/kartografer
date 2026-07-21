"use client";

/*
 * These URLs are user-managed external cover images with no reliable intrinsic
 * dimensions. Native images keep the lightbox layout predictable and avoid
 * routing those URLs through Next''s image optimizer.
 */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Compass, Eye, Maximize2, X } from "lucide-react";

type CoverImagePreviewProps = {
  imageUrl?: string | null;
  title: string;
  destination?: string | null;
};

export default function CoverImagePreview({
  imageUrl,
  title,
  destination,
}: CoverImagePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setIsMounted(true);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  if (!imageUrl) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-[28px] border border-border bg-card-secondary shadow-sm">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(84,55,29,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(84,55,29,0.08)_1px,transparent_1px)] bg-size-[28px_28px]" />
        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full border border-primary/20" />
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full border border-primary/20" />
        <div className="relative flex h-full flex-col justify-between p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">
              {destination || "Public trip"}
            </p>
            <p className="mt-1 line-clamp-2 text-lg font-black leading-tight text-foreground">
              {title}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const lightbox = isOpen ? (
    <div
      role="button"
      tabIndex={-1}
      onMouseDown={() => setIsOpen(false)}
      className="fixed inset-0 z-2147483647 flex items-center justify-center bg-black/85 px-4 py-6 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${title} cover image`}
        onMouseDown={(event) => event.stopPropagation()}
        className="relative flex max-h-[88vh] w-full max-w-5xl items-center justify-center"
      >
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close cover image"
          className="fixed right-5 top-5 z-2147483647 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex max-h-[88vh] max-w-[92vw] items-center justify-center overflow-hidden rounded-[28px] border border-white/15 bg-black shadow-2xl">
          <img
            src={imageUrl}
            alt={`${title} cover`}
            className="max-h-[88vh] max-w-[92vw] object-contain"
          />
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`View cover image for ${title}`}
        className="group relative aspect-video w-full cursor-pointer overflow-hidden rounded-[28px] border border-border bg-card-secondary text-left shadow-sm outline-none transition hover:-translate-y-0.5 hover:shadow-xl focus:ring-4 focus:ring-ring/20"
      >
        <img
          src={imageUrl}
          alt={`${title} cover`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 transition duration-300 group-hover:bg-black/35" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 group-hover:opacity-100">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/90 px-4 py-2 text-xs font-black text-[#54371d] shadow-lg">
            <Eye className="h-4 w-4" />
            View cover
          </span>
        </div>
        <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/90 text-[#54371d] shadow-sm">
          <Maximize2 className="h-4 w-4" />
        </span>
      </button>

      {isMounted && lightbox ? createPortal(lightbox, document.body) : null}
    </>
  );
}
