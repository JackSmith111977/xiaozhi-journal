"use client";

import { useEffect } from "react";
import { getSavedThemeMode, resolveTheme } from "@/lib/theme";

/**
 * Client-side hydration corrector.
 * Runs once after mount to align the document dark class with
 * the user's saved preference (auto/system/manual), correcting
 * any SSR/client time mismatch.
 */
export function ThemeHydration() {
  useEffect(() => {
    const mode = getSavedThemeMode();
    const { isDark } = resolveTheme(mode);
    const root = document.documentElement;

    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);

  return null;
}
