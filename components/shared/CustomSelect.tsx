"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type CustomSelectOption = {
  label: string;
  value: string;
  description?: string;
};

type CustomSelectProps = {
  label?: string;
  name?: string;
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  icon?: ReactNode;
};

export default function CustomSelect({
  label,
  name,
  value,
  options,
  onChange,
  placeholder = "Select option",
  disabled = false,
  error,
  icon,
}: CustomSelectProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current) return;

      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {name ? <input type="hidden" name={name} value={value} /> : null}

      {label ? (
        <label className="mb-2 block text-sm font-black text-foreground">
          {label}
        </label>
      ) : null}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border bg-input px-4 py-3 text-left text-sm font-semibold text-foreground outline-none transition ${
          isOpen
            ? "border-ring ring-4 ring-ring/20"
            : error
              ? "border-danger"
              : "border-border hover:bg-input-hover"
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {icon ? (
          <span className="shrink-0 text-secondary-foreground">{icon}</span>
        ) : null}

        <span
          className={`min-w-0 flex-1 truncate ${
            selectedOption ? "text-foreground" : "text-muted-foreground/70"
          }`}
        >
          {selectedOption?.label ?? placeholder}
        </span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-secondary-foreground transition ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {error ? (
        <p className="mt-1 text-xs font-bold text-danger">{error}</p>
      ) : null}

      {isOpen && !disabled ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-xl">
          <div className="max-h-60 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`my-1 flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    isSelected
                      ? "bg-selected text-selected-foreground"
                      : "text-secondary-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black">
                      {option.label}
                    </span>

                    {option.description ? (
                      <span
                        className={`mt-0.5 block line-clamp-1 text-xs font-semibold ${
                          isSelected
                            ? "text-selected-foreground/75"
                            : "text-muted-foreground"
                        }`}
                      >
                        {option.description}
                      </span>
                    ) : null}
                  </span>

                  {isSelected ? <Check className="h-4 w-4 shrink-0" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
