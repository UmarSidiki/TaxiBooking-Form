"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { apiGet } from "@/shared/http/api";

const STORAGE_KEY = "geo.v1";
const MAX_AGE_MS = 30 * 60 * 1000;

export type GeoInfo = {
  countryCode: string | null;
  dialCode: string | null;
  bookingBlocked: boolean;
};

const EMPTY_GEO: GeoInfo = {
  countryCode: null,
  dialCode: null,
  bookingBlocked: false,
};

type GeoContextValue = {
  geo: GeoInfo;
  isLoading: boolean;
};

const GeoContext = createContext<GeoContextValue>({
  geo: EMPTY_GEO,
  isLoading: true,
});

/**
 * Cached values expire, so an operator changing the country policy does not
 * leave visitors pinned to a stale decision for the life of the tab.
 */
function readStoredGeo(): GeoInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<GeoInfo> & { at?: number };
    if (typeof parsed.at !== "number" || Date.now() - parsed.at > MAX_AGE_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return {
      countryCode: typeof parsed.countryCode === "string" ? parsed.countryCode : null,
      dialCode: typeof parsed.dialCode === "string" ? parsed.dialCode : null,
      bookingBlocked: parsed.bookingBlocked === true,
    };
  } catch {
    return null;
  }
}

/**
 * Resolves the visitor's country at most once per browser session: the result
 * is cached in sessionStorage so reloads and step changes never re-request it.
 */
export function GeoProvider({ children }: { children: ReactNode }) {
  const [geo, setGeo] = useState<GeoInfo | null>(null);

  useEffect(() => {
    const stored = readStoredGeo();
    if (stored) {
      // Applied after mount on purpose: reading sessionStorage during render
      // would desync the server HTML from the client's cached value.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGeo(stored);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const data = await apiGet<{ success: boolean; data: GeoInfo }>("/api/geo");
        if (cancelled) return;
        setGeo(data.data);
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...data.data, at: Date.now() })
        );
      } catch {
        // Fail open: an unresolved country must never block a real customer.
        if (!cancelled) setGeo(EMPTY_GEO);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <GeoContext.Provider value={{ geo: geo ?? EMPTY_GEO, isLoading: geo === null }}>
      {children}
    </GeoContext.Provider>
  );
}

export function useGeo() {
  return useContext(GeoContext);
}
