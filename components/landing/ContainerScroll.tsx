"use client";

import type { MotionValue } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function ContainerScroll({
  titleComponent,
  children,
}: {
  titleComponent: ReactNode;
  children: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [0.74, 0.94] : [1.04, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 1], [18, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [10, -130]);

  return (
    <section
      ref={containerRef}
      className="relative flex h-256 items-center justify-center overflow-hidden border-b border-[#e8dbc8] bg-[#fffdf9] p-2 pt-36 md:h-336 md:p-20 md:pt-44"
    >
      <div className="landing-map-grid pointer-events-none absolute inset-0 opacity-35" />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-linear-to-b from-white via-white/90 to-transparent" />

      <div className="pointer-events-none absolute left-1/2 top-36 h-96 w-96 -translate-x-1/2 rounded-full bg-[#f0d7ab]/35 blur-3xl" />

      <div
        className="relative w-full py-16 md:py-36"
        style={{
          perspective: "1000px",
        }}
      >
        <Header translate={translate}>{titleComponent}</Header>

        <Card rotate={rotate} scale={scale}>
          {children}
        </Card>
      </div>
    </section>
  );
}

function Header({
  translate,
  children,
}: {
  translate: MotionValue<number>;
  children: ReactNode;
}) {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="mx-auto max-w-5xl text-center"
    >
      {children}
    </motion.div>
  );
}

function Card({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  children: ReactNode;
}) {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 0 rgba(91,53,26,0.20), 0 9px 20px rgba(91,53,26,0.18), 0 37px 37px rgba(91,53,26,0.14), 0 84px 50px rgba(91,53,26,0.08), 0 149px 60px rgba(91,53,26,0.04), 0 233px 65px rgba(91,53,26,0.02)",
      }}
      className="
        mx-auto
        -mt-8
        aspect-9/16
        w-[82vw]
        max-w-90
        rounded-[30px]
        border
        border-[#d8c2a4]
        bg-[#f3e5d0]
        p-2
        shadow-2xl

        sm:-mt-10
        sm:aspect-video
        sm:w-full
        sm:max-w-6xl

        md:-mt-12
        md:p-3
      "
    >
      <div className="h-full w-full overflow-hidden rounded-[22px] border border-[#ead9c0] bg-[#fffdf9]">
        {children}
      </div>
    </motion.div>
  );
}