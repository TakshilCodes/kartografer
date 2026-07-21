"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import LandingSectionHeading from "@/components/landing/LandingSectionHeading";
import styles from "@/components/landing/Landing.module.css";

const revealViewport = { once: true, amount: 0.15 } as const;
const smoothEase = [0.22, 1, 0.36, 1] as const;

export default function LandingWorkspaceShowcase() {
  const reducedMotion = Boolean(useReducedMotion());

  return (
    <section
      id="planner"
      className={`overflow-hidden border-b border-border py-22 sm:py-28 ${styles.mapGrid}`}
    >
      <div className="mx-auto w-full max-w-375 px-4 sm:px-6 lg:px-8">
        <LandingSectionHeading
          index="01"
          eyebrow="One workspace, from draft to export"
          title={
            <>
              Plan in the same place
              <br />
              you make the decisions.
            </>
          }
          description="Build the itinerary, compare alternatives, ask AI for changes, and export only the choices that made the final plan."
        />

        <div className="mx-auto mt-12 max-w-300">
          <div className="grid gap-4">
            <EditorPanel reducedMotion={reducedMotion} />

            <div className="grid gap-4 lg:grid-cols-2">
              <OptionsPanel reducedMotion={reducedMotion} />
              <AiChatPanel reducedMotion={reducedMotion} />
            </div>

            <PdfPanel reducedMotion={reducedMotion} />
          </div>
        </div>
      </div>
    </section>
  );
}

function EditorPanel({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <ShowcasePanel tone="editor" className="lg:min-h-84">
      <div className="grid gap-6 p-5 sm:p-7 lg:hidden">
        <EditorCopy reducedMotion={reducedMotion} />
        <motion.div {...revealFrom(reducedMotion, "right")}>
          <WorkspaceMedia />
        </motion.div>
      </div>

      <div className="relative hidden min-h-84 lg:block">
        <div className="absolute left-[4%] top-1/2 z-10 w-[35%] -translate-y-1/2">
          <EditorCopy reducedMotion={reducedMotion} />
        </div>
        <motion.div
          {...revealFrom(reducedMotion, "right")}
          className="absolute bottom-0 left-[45%] right-0 top-12"
        >
          <WorkspaceMedia attached />
        </motion.div>
      </div>
    </ShowcasePanel>
  );
}

function EditorCopy({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <motion.div {...revealFrom(reducedMotion, "left")} className="max-w-sm">
      <PanelLabel>Itinerary editor</PanelLabel>
      <FeatureCopy
        title="The plan stays editable."
        description="Move an activity, replace a stay, or rewrite a day without rebuilding the trip."
      />
    </motion.div>
  );
}

function OptionsPanel({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <ShowcasePanel tone="options" className="h-full">
      <div className="flex min-h-132 flex-col px-5 pb-5 pt-6 sm:px-6 sm:pb-6 sm:pt-7">
        <motion.div {...revealFrom(reducedMotion, "left")} className="max-w-md">
          <PanelLabel>Options panel</PanelLabel>
          <FeatureCopy
            title={
              <>
                Keep alternatives nearby,
                <br />
                not inside the final plan.
              </>
            }
            description="Compare stays, transport, meals, and activities before selecting what belongs."
          />
        </motion.div>

        <motion.div
          {...imageEnter(reducedMotion, "left", 0.08)}
          className="mt-7 min-h-60 flex-1"
        >
          <OptionMedia />
        </motion.div>
      </div>
    </ShowcasePanel>
  );
}

function AiChatPanel({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <ShowcasePanel tone="ai" className="h-full">
      <div className="relative flex min-h-132 flex-col pt-6 sm:pt-7">
        <motion.div
          {...revealFrom(reducedMotion, "left")}
          className="relative z-10 max-w-lg px-5 sm:px-6"
        >
          <PanelLabel>AI trip assistant</PanelLabel>
          <FeatureCopy
            title={
              <>
                Change one part
                <br />
                without starting over.
              </>
            }
            description="Ask for a cheaper stay, a slower day, or a different route. Review the proposed change before it reaches the itinerary."
          />
        </motion.div>

        <motion.div
          initial={reducedMotion ? false : { opacity: 0, x: 18, y: 22 }}
          whileInView={{ opacity: 1, x: 0, y: 0 }}
          viewport={revealViewport}
          transition={{ duration: 0.78, delay: 0.12, ease: smoothEase }}
          className="relative mt-4 min-h-68 flex-1 overflow-hidden lg:absolute lg:inset-0 lg:mt-0 lg:min-h-0"
        >
          <AiChatMedia />
        </motion.div>
      </div>
    </ShowcasePanel>
  );
}

function PdfPanel({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <ShowcasePanel tone="pdf" className="lg:min-h-72">
      <div className="grid gap-6 p-5 sm:p-7 lg:hidden">
        <PdfCopy reducedMotion={reducedMotion} />
        <motion.div {...imageEnter(reducedMotion, "bottomLeft", 0.1)}>
          <PdfMedia />
        </motion.div>
      </div>

      <div className="relative hidden min-h-72 lg:block">
        <motion.div
          {...imageEnter(reducedMotion, "bottomLeft", 0.1)}
          className="absolute bottom-0 left-0 h-[75%] w-[42%]"
        >
          <PdfMedia attached />
        </motion.div>
        <div className="absolute right-[4%] top-1/2 z-10 w-[42%] -translate-y-1/2">
          <PdfCopy reducedMotion={reducedMotion} card />
        </div>
      </div>
    </ShowcasePanel>
  );
}

function PdfCopy({
  reducedMotion,
  card = false,
}: {
  reducedMotion: boolean;
  card?: boolean;
}) {
  return (
    <motion.div
      {...revealFrom(reducedMotion, "right")}
      className={
        card
          ? "rounded-lg border border-border bg-background/95 p-5 shadow-[0_16px_36px_-32px_rgba(55,31,13,0.58)] sm:p-6"
          : "max-w-md"
      }
    >
      <PanelLabel>PDF export</PanelLabel>
      <FeatureCopy
        title={
          <>
            Export the decisions,
            <br />
            not the discarded options.
          </>
        }
        description="Only selected itinerary items appear in the final PDF."
      />
    </motion.div>
  );
}

function ShowcasePanel({
  children,
  className = "",
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "editor" | "options" | "ai" | "pdf";
}) {
  const toneClass = {
    default: "bg-card",
    editor: "bg-card-secondary/28",
    options: "bg-card/95",
    ai: "bg-primary/[0.045]",
    pdf: "bg-secondary/[0.055]",
  }[tone];

  return (
    <article
      className={`relative overflow-hidden rounded-xl border border-border ${toneClass} ${className}`}
    >
      {children}
    </article>
  );
}

function PanelLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-secondary-foreground">
      {children}
    </p>
  );
}

function FeatureCopy({
  title,
  description,
}: {
  title: ReactNode;
  description: string;
}) {
  return (
    <>
      <h3 className="mt-3 text-xl font-black leading-[1.12] tracking-tight text-foreground sm:text-2xl">
        {title}
      </h3>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground sm:text-[0.95rem]">
        {description}
      </p>
    </>
  );
}

function WorkspaceMedia({ attached = false }: { attached?: boolean }) {
  return (
    <div
      className={`relative h-full min-h-56 overflow-hidden border border-border bg-card-secondary/52 ${attached ? "rounded-tl-lg border-b-0 border-r-0" : "aspect-16/10 rounded-lg"}`}
    >
      <Image
        src="/landing/workspace/itinerary_editor.png"
        alt="Kartografer editable itinerary workspace"
        fill
        sizes="(min-width: 1024px) 44vw, 100vw"
        className="object-cover object-top-left"
      />
    </div>
  );
}

function OptionMedia() {
  return (
    <div className="relative h-full min-h-60 overflow-hidden rounded-lg border border-border bg-secondary/7.5">
      <Image
        src="/landing/workspace/options_panel.png"
        alt="Kartografer itinerary options panel"
        fill
        sizes="(min-width: 1024px) 36vw, 100vw"
        className="object-contain"
      />
    </div>
  );
}

function AiChatMedia() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-primary/5.5">
      <div className="absolute inset-x-0 bottom-0 h-full overflow-hidden lg:h-[58%]">
        <Image
          src="/landing/workspace/ai_chat_landing.png"
          alt="Kartografer AI chat preview"
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover object-bottom-right lg:object-top"
        />
      </div>
    </div>
  );
}

function PdfMedia({ attached = false }: { attached?: boolean }) {
  return (
    <div
      className={`relative h-full min-h-48 overflow-hidden border border-border bg-card-secondary/58 ${attached ? "rounded-tr-lg border-b-0 border-l-0" : "aspect-16/10 rounded-lg"}`}
    >
      <Image
        src="/landing/workspace/pdf_export.png"
        alt="Kartografer exported trip PDF"
        fill
        sizes="(min-width: 1024px) 34vw, 100vw"
        className="object-cover object-top-left"
      />
    </div>
  );
}

function revealFrom(
  reducedMotion: boolean,
  direction: "left" | "right" | "up" | "bottomLeft",
  delay = 0,
) {
  const offsets = {
    left: { x: -10, y: 0 },
    right: { x: 10, y: 0 },
    up: { x: 0, y: 12 },
    bottomLeft: { x: -10, y: 12 },
  }[direction];

  return {
    initial: reducedMotion ? undefined : { opacity: 0, ...offsets },
    whileInView: { opacity: 1, x: 0, y: 0 },
    viewport: revealViewport,
    transition: { duration: 0.58, delay, ease: smoothEase },
  };
}

function imageEnter(
  reducedMotion: boolean,
  direction: "left" | "up" | "bottomLeft",
  delay = 0,
) {
  const offset = {
    left: { x: -10, y: 0 },
    up: { x: 0, y: 12 },
    bottomLeft: { x: -10, y: 12 },
  }[direction];

  return {
    initial: reducedMotion ? false : { opacity: 0, ...offset },
    whileInView: { opacity: 1, x: 0, y: 0 },
    viewport: revealViewport,
    transition: { duration: 0.7, delay, ease: smoothEase },
  };
}
