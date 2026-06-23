"use client";

import { useEffect, useMemo, useState } from "react";
import Lottie from "lottie-react";
import BrandLogo from "@/components/shared/BrandLogo";

type TripGenerationLoadingProps = {
    progress: number;
    message?: string;
};

type LoadingStage = {
    min: number;
    max: number;
    title: string;
    message: string;
    animationPath: string;
};

const loadingStages: LoadingStage[] = [
    {
        min: 0,
        max: 30,
        title: "Preparing your trip",
        message: "Checking your trip details and travel preferences...",
        animationPath: "/animations/Calendar-booking.json",
    },
    {
        min: 31,
        max: 70,
        title: "Building your itinerary",
        message: "Planning routes, days, activities, stays, and food options...",
        animationPath: "/animations/man-and-travel.json",
    },
    {
        min: 71,
        max: 100,
        title: "Finalizing your plan",
        message: "Saving your trip, backup options, and budget estimate...",
        animationPath: "/animations/Travel-is-fun.json",
    },
];

function getCurrentStage(progress: number) {
    return (
        loadingStages.find(
            (stage) => progress >= stage.min && progress <= stage.max
        ) ?? loadingStages[0]
    );
}

function TripLoadingAnimation({ animationPath }: { animationPath: string }) {
    const [animationData, setAnimationData] = useState<object | null>(null);
    const [isChanging, setIsChanging] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function loadAnimation() {
            try {
                setIsChanging(true);

                await new Promise((resolve) => window.setTimeout(resolve, 220));

                const response = await fetch(animationPath);

                if (!response.ok) {
                    throw new Error("Failed to load animation.");
                }

                const data = await response.json();

                if (isMounted) {
                    setAnimationData(data);
                    setIsChanging(false);
                }
            } catch (error) {
                console.error("TRIP_LOADING_ANIMATION_ERROR", error);

                if (isMounted) {
                    setAnimationData(null);
                    setIsChanging(false);
                }
            }
        }

        loadAnimation();

        return () => {
            isMounted = false;
        };
    }, [animationPath]);

    if (!animationData) {
        return (
            <div className="mx-auto flex h-56 w-56 items-center justify-center sm:h-60 sm:w-60">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-secondary border-t-primary" />
            </div>
        );
    }

    return (
        <div
            className={`mx-auto flex h-56 w-56 items-center justify-center transition-all duration-300 ease-out sm:h-60 sm:w-60 ${isChanging
                    ? "translate-y-2 scale-95 opacity-0"
                    : "translate-y-0 scale-100 opacity-100"
                }`}
        >
            <Lottie
                key={animationPath}
                animationData={animationData}
                loop
                autoplay
                className="h-full w-full object-contain"
            />
        </div>
    );
}

export default function TripGenerationLoading({
    progress,
    message,
}: TripGenerationLoadingProps) {
    const safeProgress = Math.min(Math.max(progress, 0), 100);

    const currentStage = useMemo(
        () => getCurrentStage(safeProgress),
        [safeProgress]
    );

    return (
        <div className="fixed inset-0 z-9999 flex min-h-screen items-center justify-center bg-background px-4">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute left-1/2 -top-40 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute -bottom-40 -right-30 h-80 w-80 rounded-full bg-selected/25 blur-3xl" />
            </div>

            <div className="relative w-full max-w-xl text-center">
                <TripLoadingAnimation animationPath={currentStage.animationPath} />

                <div className="mt-6">
                    <BrandLogo themeAware className="mb-4 justify-center" compactClassName="h-11 w-11" wordmarkClassName="h-auto w-48" />
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-secondary-foreground">
                        Kartografer AI
                    </p>

                    <h1 className="mt-3 text-2xl font-black text-foreground sm:text-4xl">
                        {currentStage.title}
                    </h1>

                    <p className="mx-auto mt-4 min-h-6 max-w-md text-sm font-semibold leading-6 text-muted-foreground">
                        {message || currentStage.message}
                    </p>
                </div>

                <div className="mx-auto mt-9 max-w-lg">
                    <div className="h-3 overflow-hidden rounded-full bg-secondary">
                        <div
                            className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
                            style={{
                                width: `${safeProgress}%`,
                            }}
                        />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs font-black text-secondary-foreground">
                        <span>Creating your trip</span>
                        <span>{safeProgress}%</span>
                    </div>
                </div>

                <p className="mx-auto mt-8 max-w-md text-xs leading-6 text-muted-foreground">
                    Please keep this page open while we generate your selected itinerary,
                    alternative options, and budget estimate.
                </p>
            </div>
        </div>
    );
}