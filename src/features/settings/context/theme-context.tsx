"use client";

import { resolveColorPalette } from "@/features/settings/lib/color-palettes";
import { customPaletteCss } from "@/features/settings/lib/custom-palette";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiFetch } from "@/shared/http/api";
import type { PublicSettings } from "@/features/settings/lib/public-settings";
import type { ThemeSettings } from "@/features/settings/lib/theme-settings";

interface ThemeContextType {
  settings: PublicSettings | null;
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
  const [settings, setSettings] = useState<PublicSettings | null>(initialSettings ?? null);
  const [isLoading, setIsLoading] = useState(!initialSettings);

  // Centralized fetch function so it can be invoked on mount and when settings change elsewhere
  const fetchSettings = async () => {
    try {
      const data = await apiFetch<{ success: boolean; data: PublicSettings }>("/api/settings");
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch theme settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialSettings) {
      fetchSettings();
    }
  }, [initialSettings]);

  // Listen for global settings updates and apply delta from event.detail (no refetch when possible)
  useEffect(() => {
    const onSettingsUpdated = (e: Event) => {
      const custom = e as CustomEvent<PublicSettings | undefined>;
      if (custom && custom.detail) {
        // Apply new settings directly from event.detail (fast, avoids another GET)
        setSettings(custom.detail);
        setIsLoading(false);
      } else {
        // Fallback: fetch from server
        fetchSettings();
      }
    };

    window.addEventListener('settingsUpdated', onSettingsUpdated as EventListener);
    return () => window.removeEventListener('settingsUpdated', onSettingsUpdated as EventListener);
  }, []);

  useEffect(() => {
    if (settings) {
      const root = document.documentElement;
      const radius =
        typeof settings.borderRadius === "number" ? settings.borderRadius : 0.5;

      root.style.setProperty("--border-radius", `${radius}rem`);
      // First paint already carries these from the server; this only follows saves made in this tab.
      const palette = resolveColorPalette(settings.colorPalette);
      root.dataset.palette = palette;
      let tag = document.getElementById("custom-palette");
      if (palette === "custom") {
        if (!tag) {
          tag = document.createElement("style");
          tag.id = "custom-palette";
          document.head.appendChild(tag);
        }
        tag.textContent = customPaletteCss(settings.customPalette);
      }
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
