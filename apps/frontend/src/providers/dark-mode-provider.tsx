"use client";

import { createContext, useContext, useEffect, useState } from "react";

type DarkModeState = {
  darkMode: boolean;
  toggle: () => void;
};

const DarkModeContext = createContext<DarkModeState | null>(null);

type DarkModeProviderProps = {
  children: React.ReactNode;
};

export function DarkModeProvider({ children }: DarkModeProviderProps) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const rememberedDarkMode = localStorage.getItem("prefer-dark-mode");

    if (rememberedDarkMode != null) {
      setDarkMode(rememberedDarkMode === "true");
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      localStorage.setItem("prefer-dark-mode", String(prefersDark));
      setDarkMode(prefersDark);
    }
  }, []);

  const toggle = () => {
    setDarkMode((prev) => {
      localStorage.setItem("prefer-dark-mode", !prev ? "true" : "false");

      return !prev;
    });
  };

  return (
    <DarkModeContext.Provider value={{ darkMode, toggle }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const ctx = useContext(DarkModeContext);

  if (!ctx) throw new Error("useDarkMode must be used within DarkModeProvider");

  return ctx;
}
