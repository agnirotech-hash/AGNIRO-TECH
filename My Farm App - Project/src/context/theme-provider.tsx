
"use client"

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
  // Props like attribute, enableSystem, disableTransitionOnChange are accepted via ...props
  // but not explicitly used by this custom provider's logic.
  [key: string]: any; 
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme", // Changed default from "vite-ui-theme" to "theme"
  ...props
}: ThemeProviderProps) {
  // Initialize state with defaultTheme. localStorage will be checked client-side.
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  // Effect to load theme from localStorage on mount (client-side only)
  useEffect(() => {
    const storedTheme = localStorage.getItem(storageKey) as Theme | null;
    if (storedTheme) {
      setTheme(storedTheme);
    }
    // If no stored theme, `theme` remains `defaultTheme` from `useState` initialization.
    // The effect below will handle applying 'system' theme if `defaultTheme` is 'system'.
  }, [storageKey]);

  // Effect to apply the theme to the DOM and handle 'system' theme changes.
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    let currentAppliedTheme = theme;
    if (theme === "system") {
      currentAppliedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    root.classList.add(currentAppliedTheme);

    // If theme is 'system', listen for OS theme changes
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        root.classList.remove("light", "dark");
        root.classList.add(e.matches ? "dark" : "light");
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]); // Re-run when theme state changes.

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
