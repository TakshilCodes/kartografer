"use client";

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

        <div className="relative mt-2 h-190 overflow-hidden sm:h-115 lg:h-180">
          <CircularGallery
            items={templateGalleryItems}
            bend={2}
            textColor="#5b351a"
            borderRadius={0.055}
            scrollSpeed={1.35}
            scrollEase={0.045}
            font='800 30px "Segoe UI"'
          />
        </div>
      </div>
    </section>
  );
}