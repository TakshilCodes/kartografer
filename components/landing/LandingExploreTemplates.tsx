"use client";

import { ChevronRight } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import CircularGallery from "@/components/landing/CircularGallery";

const templateGalleryItems = [
  {
    image: "/landing/templates/himachal.jpg",
    text: "Himachal Family Escape",
  },
  {
    image: "/landing/templates/rajasthan.jpg",
    text: "Rajasthan Heritage Route",
  },
  {
    image: "/landing/templates/ladakh.jpg",
    text: "Ladakh Road Trip",
  },
  {
    image: "/landing/templates/sikkim.jpg",
    text: "Sikkim Budget Plan",
  },
  {
    image: "/landing/templates/kashmir.jpg",
    text: "Kashmir Family Trip",
  },
  {
    image: "/landing/templates/goa.jpg",
    text: "Goa Weekend",
  },
  {
    image: "/landing/templates/kerala.jpg",
    text: "Kerala Backwaters",
  },
  {
    image: "/landing/templates/jaipur.jpg",
    text: "Jaipur Heritage",
  },
];

export default function LandingExploreTemplates() {
  return (
    <section
      id="explore"
      className="relative overflow-hidden border-b border-[#e8dbc8] bg-[#fffaf3] px-4 py-20 sm:px-6 lg:px-8 lg:py-24"
    >
      <div className="landing-map-grid pointer-events-none absolute inset-0 opacity-35" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-white via-[#fffaf3]/90 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-20 h-96 w-96 -translate-x-1/2 rounded-full bg-[#f0d7ab]/40 blur-3xl" />

      <div className="relative mx-auto">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex rounded-full border border-[#dcc6a8] bg-white/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#9b6034] shadow-sm backdrop-blur">
            Public templates
          </div>

          <h2 className="text-3xl font-black leading-tight tracking-[-0.04em] text-[#2d1e11] sm:text-5xl lg:text-[3.4rem]">
            Start with a route that already knows where it is going.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm font-semibold leading-6 text-[#806a55] sm:text-base sm:leading-7">
            Browse real itinerary structures, inspect their days and costs, then
            use a template as the beginning of your own plan.
          </p>
        </div>

        <MobileTripGallery items={templateGalleryItems} />

        <div className="hidden sm:block">
          <div className="relative h-140 w-full overflow-hidden lg:h-162.5">
            <CircularGallery
              items={templateGalleryItems}
              bend={2.6}
              borderRadius={0.06}
              textColor="#5b351a"
              scrollSpeed={1.8}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

type GalleryItem = {
  image: string;
  text: string;
};

type RenderGalleryItem = GalleryItem & {
  renderId: string;
};

function createRenderBatch(items: GalleryItem[], batchNumber: number) {
  return items.map((item, index) => ({
    ...item,
    renderId: `${batchNumber}-${index}-${item.text}`,
  }));
}

function MobileTripGallery({ items }: { items: GalleryItem[] }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const batchRef = useRef(3);
  const isRecyclingRef = useRef(false);
  const pendingScrollAdjustmentRef = useRef<number | null>(null);

  const [visibleItems, setVisibleItems] = useState<RenderGalleryItem[]>(() => [
    ...createRenderBatch(items, 0),
    ...createRenderBatch(items, 1),
    ...createRenderBatch(items, 2),
  ]);

  useEffect(() => {
    batchRef.current = 3;
    pendingScrollAdjustmentRef.current = null;
    isRecyclingRef.current = false;

    setVisibleItems([
      ...createRenderBatch(items, 0),
      ...createRenderBatch(items, 1),
      ...createRenderBatch(items, 2),
    ]);
  }, [items]);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    const adjustment = pendingScrollAdjustmentRef.current;

    if (!container || adjustment === null) return;

    pendingScrollAdjustmentRef.current = null;

    const previousScrollBehavior = container.style.scrollBehavior;
    const previousScrollSnapType = container.style.scrollSnapType;

    container.style.scrollBehavior = "auto";
    container.style.scrollSnapType = "none";

    container.scrollLeft = Math.max(container.scrollLeft - adjustment, 0);

    window.requestAnimationFrame(() => {
      container.style.scrollBehavior = previousScrollBehavior;
      container.style.scrollSnapType = previousScrollSnapType;
      isRecyclingRef.current = false;
    });
  }, [visibleItems]);

  function recycleCardsIfNeeded() {
    const container = scrollRef.current;

    if (!container || items.length === 0 || isRecyclingRef.current) return;

    const distanceFromEnd =
      container.scrollWidth - container.scrollLeft - container.clientWidth;

    if (distanceFromEnd > 700) return;

    const firstCard = container.children[0] as HTMLElement | undefined;
    const firstCardAfterRemovedBatch = container.children[items.length] as
      | HTMLElement
      | undefined;

    if (!firstCard || !firstCardAfterRemovedBatch) return;

    const removedBatchWidth =
      firstCardAfterRemovedBatch.offsetLeft - firstCard.offsetLeft;

    if (removedBatchWidth <= 0) return;

    isRecyclingRef.current = true;
    pendingScrollAdjustmentRef.current = removedBatchWidth;

    const nextBatchNumber = batchRef.current;
    batchRef.current += 1;

    setVisibleItems((current) => {
      const withoutOldestBatch = current.slice(items.length);
      const nextBatch = createRenderBatch(items, nextBatchNumber);

      return [...withoutOldestBatch, ...nextBatch];
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="relative mt-8 block sm:hidden">
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9b6034]">
          Public templates
        </p>

        <div className="flex items-center gap-1.5 rounded-full border border-[#e3cdae] bg-[#fffaf3] px-3 py-1.5 text-[11px] font-black text-[#704522] shadow-sm">
          <span>Swipe</span>
          <ChevronRight className="h-3.5 w-3.5 animate-pulse" />
        </div>
      </div>

      <div className="relative -mx-4 overflow-hidden pl-4">
        <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-14 bg-linear-to-l from-[#fffaf3] via-[#fffaf3]/90 to-transparent" />

        <div
          ref={scrollRef}
          onScroll={recycleCardsIfNeeded}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5 pr-6 [-ms-overflow-style:none] scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          {visibleItems.map((item) => (
            <article
              key={item.renderId}
              className="w-[80vw] max-w-82.5 flex-none snap-center overflow-hidden rounded-[28px] border border-[#e3cdae] bg-[#fffaf3] shadow-[0_18px_45px_rgba(91,53,26,0.14)]"
            >
              <div className="relative aspect-4/5 overflow-hidden rounded-[26px] bg-[#f3e6d5]">
                <img
                  src={item.image}
                  alt={item.text}
                  className="h-full w-full object-cover"
                  draggable={false}
                />

                <div className="absolute left-3 top-3 rounded-full border border-white/60 bg-white/85 px-3 py-1 text-[10px] font-black uppercase text-[#5b351a] shadow-sm backdrop-blur">
                  Template
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-xl font-black leading-tight text-[#3a2414]">
                  {item.text}
                </h3>

                <p className="mt-2 text-sm font-semibold leading-5 text-[#806a55]">
                  Swipe to explore more ready-made trip ideas.
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}