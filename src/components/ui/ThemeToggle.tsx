"use client";

import { useSyncExternalStore } from "react";

type ThemeMode = "dark" | "light";

const STORAGE_KEY = "vaultedge-theme";
const THEME_EVENT = "vaultedge-theme-change";

function subscribeTheme(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      onStoreChange();
    }
  };
  window.addEventListener(THEME_EVENT, onStoreChange);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(THEME_EVENT, onStoreChange);
    window.removeEventListener("storage", handleStorage);
  };
}

function getClientThemeSnapshot(): ThemeMode {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") {
    return attr;
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
  } catch {
    // Fallback to dark mode
  }
  return "dark";
}

function getServerThemeSnapshot(): ThemeMode {
  return "dark";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getClientThemeSnapshot,
    getServerThemeSnapshot
  );

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    root.setAttribute("data-theme", nextTheme);
    root.classList.remove("light", "dark");
    root.classList.add(nextTheme);
    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Ignore storage errors in restricted environments
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  };

  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      title={isLight ? "Switch to dark mode" : "Switch to light mode"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-accent transition-colors hover:border-accent hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {isLight ? (
        /* Moon Icon for switching back to Dark Mode */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        /* Sun Icon shown in Dark Mode (matches Stitch reference) */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      )}
    </button>
  );
}
