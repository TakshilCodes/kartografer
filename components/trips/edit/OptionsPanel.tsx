"use client";

import { useRef, useState } from "react";
import { BedDouble, Car, MapPin, Plus, Sparkles } from "lucide-react";

const suggestionGroups = [
    {
        title: "Activities",
        icon: Sparkles,
        items: [
            {
                title: "Shikara Ride",
                subtitle: "Dal Lake · 1.5 hours",
                meta: "₹1,200",
            },
            {
                title: "Boulevard Road Walk",
                subtitle: "Evening lakeside walk",
                meta: "Free",
            },
            {
                title: "Mughal Garden Visit",
                subtitle: "Sightseeing · 2 hours",
                meta: "₹300",
            },
        ],
    },
    {
        title: "Stays",
        icon: BedDouble,
        items: [
            {
                title: "Houseboat near Dal Lake",
                subtitle: "Scenic stay · Family friendly",
                meta: "₹5,500/night",
            },
            {
                title: "Hotel near Boulevard",
                subtitle: "Central area · Easy access",
                meta: "₹3,800/night",
            },
        ],
    },
    {
        title: "Transport",
        icon: Car,
        items: [
            {
                title: "Private cab for sightseeing",
                subtitle: "Comfortable for family",
                meta: "₹3,500/day",
            },
            {
                title: "Airport pickup",
                subtitle: "Srinagar Airport → Dal Lake",
                meta: "₹1,200",
            },
        ],
    },
    {
        title: "Hidden Spots",
        icon: MapPin,
        items: [
            {
                title: "Quiet Dal Lake viewpoint",
                subtitle: "Good for photos",
                meta: "Hidden gem",
            },
            {
                title: "Local kahwa stop",
                subtitle: "Small authentic tea place",
                meta: "Food stop",
            },
        ],
    },
];

function OptionsPanelContent() {
    return (
        <div className="space-y-3">
            {suggestionGroups.map((group) => {
                const Icon = group.icon;

                return (
                    <div key={group.title}>
                        <div className="mb-2 flex items-center gap-2">
                            <Icon className="h-4 w-4 text-primary" />
                            <h3 className="text-xs font-black uppercase tracking-[0.16em] text-secondary-foreground">
                                {group.title}
                            </h3>
                        </div>

                        <div className="space-y-2">
                            {group.items.map((item) => (
                                <div
                                    key={item.title}
                                    className="rounded-2xl border border-border bg-dashboard p-2.5 transition hover:bg-card"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-black text-foreground">
                                                {item.title}
                                            </p>

                                            <p className="mt-0.5 line-clamp-1 text-[11px] font-semibold text-secondary-foreground">
                                                {item.subtitle}
                                            </p>

                                            <p className="mt-2 text-[11px] font-black text-primary">
                                                {item.meta}
                                            </p>
                                        </div>

                                        <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary-hover">
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function OptionsPanel() {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [isAtTop, setIsAtTop] = useState(true);
    const [isAtBottom, setIsAtBottom] = useState(false);

    function handleScroll() {
        const element = scrollRef.current;

        if (!element) return;

        const distanceFromTop = element.scrollTop;
        const distanceFromBottom =
            element.scrollHeight - element.scrollTop - element.clientHeight;

        setIsAtTop(distanceFromTop < 8);
        setIsAtBottom(distanceFromBottom < 8);
    }

    return (
        <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[26px] border border-border bg-card shadow-sm">
            <div className="shrink-0 border-b border-border bg-card-secondary/50 px-4 py-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <div>
                        <h2 className="text-sm font-black text-foreground">
                            Options Panel
                        </h2>
                        <p className="text-xs font-semibold text-secondary-foreground">
                            Scroll suggestions and add items to your plan
                        </p>
                    </div>
                </div>
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden">
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="h-full overflow-y-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    <OptionsPanelContent />
                </div>

                {!isAtTop ? (
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-card via-card/80 to-transparent" />
                ) : null}

                {!isAtBottom ? (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card via-card/80 to-transparent" />
                ) : null}
            </div>
        </section>
    );
}

export { OptionsPanelContent };