"use client";

import { motion } from "framer-motion";

type ShinyTextDirection = "left" | "right";

type ShinyTextProps = {
  text: string;
  speed?: number;
  delay?: number;
  color?: string;
  shineColor?: string;
  spread?: number;
  direction?: ShinyTextDirection;
  yoyo?: boolean;
  pauseOnHover?: boolean;
  disabled?: boolean;
  className?: string;
};

export default function ShinyText({
  text,
  speed = 4,
  delay = 0,
  color = "#9b6034",
  shineColor = "#2d1e11",
  spread = 90,
  direction = "left",
  yoyo = false,
  pauseOnHover = false,
  disabled = false,
  className = "",
}: ShinyTextProps) {
  const start = direction === "left" ? "125% 50%" : "-25% 50%";
  const end = direction === "left" ? "-25% 50%" : "125% 50%";

  if (disabled) {
    return (
      <span className={className} style={{ color }}>
        {text}
      </span>
    );
  }

  return (
    <motion.span
      className={`inline-block whitespace-nowrap bg-clip-text text-transparent ${pauseOnHover ? "hover:[animation-play-state:paused]" : ""} ${className}`}
      style={{
        backgroundImage: `linear-gradient(110deg, ${color} 0%, ${color} 30%, ${shineColor} 42%, #fff3c4 50%, ${shineColor} 58%, ${color} 70%, ${color} 100%)`,
        backgroundSize: `${Math.max(spread * 3.2, 260)}% 100%`,
        textShadow: "0 0 0.01px currentColor",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
      initial={{ backgroundPosition: start }}
      animate={{ backgroundPosition: yoyo ? [start, end, start] : [start, end] }}
      transition={{
        duration: speed,
        delay,
        ease: "easeInOut",
        repeat: Number.POSITIVE_INFINITY,
        repeatDelay: delay,
      }}
    >
      {text}
    </motion.span>
  );
}