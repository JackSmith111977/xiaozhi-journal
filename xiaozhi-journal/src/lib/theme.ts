// Theme utility functions — pure, no side effects

export type ThemeMode = "auto" | "warm-sun" | "starry-night" | "system";

const THEME_KEY = "xiaozhi:themeMode";

/**
 * Returns the time-based theme: warm-sun (06:00-17:59) or starry-night (18:00-05:59).
 */
export function getTimeTheme(): "warm-sun" | "starry-night" {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "warm-sun" : "starry-night";
}

/**
 * Read saved theme mode from localStorage. Defaults to "auto".
 */
export function getSavedThemeMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (
      saved === "auto" ||
      saved === "warm-sun" ||
      saved === "starry-night" ||
      saved === "system"
    ) {
      return saved;
    }
  } catch {
    // localStorage unavailable (SSR / private browsing)
  }
  return "auto";
}

/**
 * Save theme mode to localStorage.
 */
export function saveThemeMode(mode: ThemeMode) {
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch (e) {
    console.warn("Failed to save theme mode:", e);
  }
}

/**
 * Resolve the effective theme given a mode.
 * Returns the resolved theme plus whether the dark class should be applied.
 */
export function resolveTheme(mode: ThemeMode): {
  theme: "warm-sun" | "starry-night";
  isDark: boolean;
} {
  if (mode === "auto") {
    const t = getTimeTheme();
    return { theme: t, isDark: t === "starry-night" };
  }

  if (mode === "system") {
    if (typeof window !== "undefined" && window.matchMedia) {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return {
        theme: prefersDark ? "starry-night" : "warm-sun",
        isDark: prefersDark,
      };
    }
    // Fallback to auto if matchMedia unavailable (SSR)
    const t = getTimeTheme();
    return { theme: t, isDark: t === "starry-night" };
  }

  // Manual override
  return { theme: mode, isDark: mode === "starry-night" };
}
