"use client";

import { useState, useEffect, useCallback } from "react";
import {
  type ThemeMode,
  getSavedThemeMode,
  saveThemeMode,
  resolveTheme,
} from "@/lib/theme";

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(() => getSavedThemeMode());
  const { theme, isDark } = resolveTheme(mode);

  // Apply dark class to document element
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  // Listen for system theme changes when in "system" mode
  useEffect(() => {
    if (mode !== "system") return;
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      // Force re-render by toggling state
      setModeState("system");
    };
    mq.addEventListener("change", handler);
    return () => {
      mq.removeEventListener("change", handler);
    };
  }, [mode]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    saveThemeMode(newMode);
  }, []);

  const resetToAuto = useCallback(() => {
    setModeState("auto");
    saveThemeMode("auto");
  }, []);

  return { mode, theme, isDark, setMode, resetToAuto };
}
