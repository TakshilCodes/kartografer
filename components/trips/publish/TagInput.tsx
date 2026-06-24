"use client";

import { useState } from "react";
import { Tag, X } from "lucide-react";

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
};

const MAX_TAG_LENGTH = 35;

export default function TagInput({ value, onChange, maxTags = 15 }: TagInputProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  function addTag(rawTag: string) {
    const tag = rawTag.trim().toLowerCase();

    if (!tag) {
      setInput("");
      return;
    }

    if (tag.length >= MAX_TAG_LENGTH) {
      setError("Each tag must be less than 35 characters.");
      return;
    }

    if (/\s/.test(tag)) {
      setError("Tags cannot contain spaces. Use hyphens instead.");
      return;
    }

    if (value.includes(tag)) {
      setError("This tag is already added.");
      setInput("");
      return;
    }

    if (value.length >= maxTags) {
      setError(`You can add up to ${maxTags} tags.`);
      return;
    }

    onChange([...value, tag]);
    setInput("");
    setError("");
  }

  function removeTag(tagToRemove: string) {
    onChange(value.filter((tag) => tag !== tagToRemove));
    setError("");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(input);
      return;
    }

    if (event.key === "Backspace" && !input && value.length > 0) {
      event.preventDefault();
      onChange(value.slice(0, -1));
      setError("");
    }
  }

  return (
    <section className="space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-foreground">Tags</p>
          <p className="mt-1 text-xs leading-5 text-secondary-foreground">
            Press Enter or comma to add a tag. Use hyphens instead of spaces.
          </p>
        </div>
        {value.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              onChange([]);
              setError("");
            }}
            className="shrink-0 cursor-pointer text-xs font-black text-danger transition hover:text-danger/80"
          >
            Clear all
          </button>
        ) : null}
      </div>

      <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-2xl border border-border bg-input px-3 py-2 transition focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/20">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card-secondary px-3 py-1.5 text-xs font-black text-foreground shadow-sm"
          >
            <Tag className="h-3 w-3 text-primary" />
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-0.5 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-secondary-foreground transition hover:bg-danger/15 hover:text-danger"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        <input
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setError("");
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(input)}
          placeholder={value.length ? "Add another tag" : "Add tags and press Enter"}
          className="min-w-35 flex-1 bg-transparent px-1 py-1.5 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold text-secondary-foreground">
          {value.length}/{maxTags} tags added
        </p>
        <p className="font-semibold text-secondary-foreground">Example: road-trip, family, budget</p>
      </div>

      {error ? (
        <p className="rounded-2xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-bold text-danger">
          {error}
        </p>
      ) : null}
    </section>
  );
}