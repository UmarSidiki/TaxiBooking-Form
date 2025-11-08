"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiFetch } from "@/utils/api";
import type { ISetting } from "@/models/settings";
import type { ThemeSettings } from "@/lib/theme-settings";

interface ThemeContextType {
  settings: Partial<ISetting> | null;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  settings: null,
  isLoading: true,
});

type ThemeProviderProps = {
  children: ReactNode;
  initialSettings?: ThemeSettings | null;
};

export function ThemeProvider({ children, initialSettings = null }: ThemeProviderProps) {
  const [settings, setSettings] = useState<Partial<ISetting> | null>(initialSettings ?? null);
  const [isLoading, setIsLoading] = useState(!initialSettings);

  useEffect(() => {
    if (!initialSettings) {
      const fetchSettings = async () => {
        try {
          const data = await apiFetch<{ success: boolean; data: Partial<ISetting> }>("/api/settings");
          if (data.success) {
            setSettings(data.data);
          }
        } catch (error) {
          console.error("Failed to fetch theme settings:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchSettings();
    }
  }, [initialSettings]);

  useEffect(() => {
    if (settings) {
      const root = document.documentElement;
      const primary = settings.primaryColor ?? "#EAB308";
      const secondary = settings.secondaryColor ?? "#111827";
      const radius =
        typeof settings.borderRadius === "number" ? settings.borderRadius : 0.5;

      root.style.setProperty("--primary-color", primary);
      root.style.setProperty("--secondary-color", secondary);
      root.style.setProperty("--border-radius", `${radius}rem`);
      if (isLoading) {
        setIsLoading(false);
      }
    }
  }, [settings, isLoading]);

  return (
    <ThemeContext.Provider value={{ settings, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
