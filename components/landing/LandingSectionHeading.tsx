import type { ReactNode } from "react";

type LandingSectionHeadingProps = {
  index: string;
  eyebrow: string;
  title: ReactNode;
  description: string;
  align?: "left" | "center";
};

export default function LandingSectionHeading({
  index,
  eyebrow,
  title,
  description,
  align = "left",
}: LandingSectionHeadingProps) {
  const centered = align === "center";

  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}>
      <div
        className={`flex items-center gap-3 ${centered ? "justify-center" : ""}`}
      >
        <span className="font-mono text-[11px] font-black text-primary">
          {index}
        </span>
        <span className="h-px w-8 bg-primary/35" aria-hidden="true" />
        <p className="text-[11px] font-black uppercase text-secondary-foreground">
          {eyebrow}
        </p>
      </div>
      <h2 className="mt-5 text-3xl font-black leading-[1.08] text-foreground sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p
        className={`mt-5 text-base leading-7 text-muted-foreground sm:text-lg ${centered ? "mx-auto max-w-2xl" : ""}`}
      >
        {description}
      </p>
    </div>
  );
}
