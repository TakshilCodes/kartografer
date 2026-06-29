"use client";

import { useMemo, useState } from "react";

type ReadMoreTextProps = {
  text: string | null | undefined;
  lines?: number;
  className?: string;
  buttonClassName?: string;
  buttonPlacement?: "inline" | "block";
};

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncateAtWord(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;

  const trimmed = value.slice(0, maxLength).trimEnd();
  const lastSpaceIndex = trimmed.lastIndexOf(" ");
  const safeText = lastSpaceIndex > 40 ? trimmed.slice(0, lastSpaceIndex) : trimmed;

  return safeText.replace(/[,.!?;:]$/, "") + "...";
}

function getFirstSentencePreview(text: string, maxLength: number) {
  const firstSentenceMatch = text.match(/^(.+?[.!?])(?:\s+|$)/);
  const firstSentence = firstSentenceMatch?.[1]?.trim();

  if (firstSentence) {
    return truncateAtWord(firstSentence, maxLength);
  }

  return truncateAtWord(text, maxLength);
}

export default function ReadMoreText({
  text,
  lines = 2,
  className = "",
  buttonClassName = "",
  buttonPlacement = "inline",
}: ReadMoreTextProps) {
  const cleanText = useMemo(() => normalizeText(text ?? ""), [text]);
  const previewLength = Math.max(90, lines * 70);
  const previewText = useMemo(
    () => getFirstSentencePreview(cleanText, previewLength),
    [cleanText, previewLength]
  );
  const contentKey = cleanText + "::" + lines;
  const [expandedState, setExpandedState] = useState({
    key: "",
    value: false,
  });
  const expanded =
    expandedState.key === contentKey ? expandedState.value : false;
  const canToggle = previewText.length < cleanText.length;

  if (!cleanText) return null;

  const visibleText = expanded || !canToggle ? cleanText : previewText;
  const buttonLabel = expanded ? "Show less" : "Read more";
  const buttonBaseClass =
    "cursor-pointer appearance-none border-0 bg-transparent p-0 text-xs font-black text-primary underline-offset-3 transition hover:text-primary-hover hover:underline focus:outline-none focus:ring-0 focus-visible:underline";

  function toggleExpanded() {
    setExpandedState({
      key: contentKey,
      value: !expanded,
    });
  }

  if (buttonPlacement === "block") {
    return (
      <div className="min-w-0">
        <p className={className}>{visibleText}</p>

        {canToggle ? (
          <button
            type="button"
            aria-expanded={expanded}
            className={`mt-1 inline-flex ${buttonBaseClass} ${buttonClassName}`}
            onClick={toggleExpanded}
          >
            {buttonLabel}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <p className={className}>
        {visibleText}
        {canToggle ? (
          <>
            {" "}
            <button
              type="button"
              aria-expanded={expanded}
              className={`inline align-baseline ${buttonBaseClass} ${buttonClassName}`}
              onClick={toggleExpanded}
            >
              {buttonLabel}
            </button>
          </>
        ) : null}
      </p>
    </div>
  );
}
