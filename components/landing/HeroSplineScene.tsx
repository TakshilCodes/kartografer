"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const SCENE_URL =
  "https://prod.spline.design/MNq-UdotPqQAbcDY/scene.splinecode";

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => null,
});

type HeroSplineSceneProps = {
  reducedMotion?: boolean;
};

export default function HeroSplineScene({
  reducedMotion = false,
}: HeroSplineSceneProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (loaded || failed) return;

    const timeout = window.setTimeout(() => {
      setFailed(true);
    }, 20_000);

    return () => window.clearTimeout(timeout);
  }, [loaded, failed]);

  return (
    <div
      className="relative h-full w-full"
      role="img"
      aria-label="Interactive 3D travel landscape."
    >
      {!loaded && !failed ? <SplineSkeleton /> : null}

      {failed ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            3D preview unavailable
          </p>
        </div>
      ) : null}

      {!failed ? (
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${
            loaded ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          style={{
            touchAction: "pan-y",
          }}
          aria-hidden="true"
        >
          <Spline
            scene={SCENE_URL}
            renderOnDemand
            onLoad={() => {
              setLoaded(true);
              setFailed(false);
            }}
            className="h-full w-full [&_canvas]:h-full [&_canvas]:w-full"
            style={{
              width: "100%",
              height: "100%",
              background: "transparent",
              touchAction: "pan-y",
              pointerEvents: reducedMotion ? "none" : "auto",
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function SplineSkeleton() {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute inset-[12%] animate-pulse rounded-[42%] bg-primary/[0.035] blur-3xl" />

      <div className="absolute left-[15%] top-[32%] h-[38%] w-[68%] animate-pulse rounded-[45%] bg-primary/4.5" />

      <div className="absolute left-[23%] top-[38%] h-24 w-24 animate-pulse rounded-full bg-primary/5.5 blur-xl" />

      <div className="absolute right-[24%] top-[31%] h-32 w-32 animate-pulse rounded-full bg-primary/4 blur-2xl" />

      <div className="absolute bottom-[22%] left-1/2 h-5 w-[48%] -translate-x-1/2 animate-pulse rounded-full bg-primary/5 blur-md" />

      <div className="absolute bottom-[12%] left-1/2 flex -translate-x-1/2 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/65">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/60" />
        Loading scene
      </div>
    </div>
  );
}