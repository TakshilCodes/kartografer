"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ThemePreferenceValue = "LIGHT" | "DARK" | "SYSTEM";

type ThemeContextValue = {
  preference: ThemePreferenceValue;
  setThemePreference: (preference: ThemePreferenceValue) => void;
};

const STORAGE_KEY = "kartografer-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveTheme(preference: ThemePreferenceValue) {
  if (preference === "SYSTEM") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  return preference === "DARK" ? "dark" : "light";
}

function getInitialPreference(initialPreference: ThemePreferenceValue) {
  if (typeof window === "undefined") return initialPreference;

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "LIGHT" || stored === "DARK" || stored === "SYSTEM"
    ? stored
    : initialPreference;
}

function applyTheme(preference: ThemePreferenceValue) {
  const resolved = resolveTheme(preference);
  const dashboardShell = document.querySelector<HTMLElement>(
    "[data-dashboard-shell]"
  );

  document.documentElement.classList.remove("dark");
  delete document.documentElement.dataset.theme;

  if (dashboardShell) {
    dashboardShell.classList.toggle("dark", resolved === "dark");
    dashboardShell.dataset.theme = resolved;
  }

  return resolved;
}

export function ThemeProvider({
  children,
  initialPreference = "SYSTEM",
}: {
  children: React.ReactNode;
  initialPreference?: ThemePreferenceValue;
}) {
  const [preference, setPreference] = useState<ThemePreferenceValue>(() =>
    getInitialPreference(initialPreference)
  );
  const setThemePreference = useCallback((next: ThemePreferenceValue) => {
    setPreference(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }, []);

  useEffect(() => {
    applyTheme(preference);
  }, [preference]);

  useEffect(() => {
    if (preference !== "SYSTEM") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("SYSTEM");
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [preference]);

  const value = useMemo(
    () => ({ preference, setThemePreference }),
    [preference, setThemePreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function ThemePreferenceSync({
  preference,
}: {
  preference: ThemePreferenceValue;
}) {
  const { setThemePreference } = useTheme();

  useEffect(() => {
    setThemePreference(preference);
  }, [preference, setThemePreference]);

  return null;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider.");
  return context;
}