"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type DeskPageMetaState = {
  title?: string;
  description?: string;
};

type DeskPageChromeValue = {
  meta: DeskPageMetaState;
  setMeta: (meta: DeskPageMetaState) => void;
  clearMeta: () => void;
};

const DeskPageChromeContext = createContext<DeskPageChromeValue | null>(null);

export function DeskPageChromeProvider({ children }: { children: ReactNode }) {
  const [meta, setMetaState] = useState<DeskPageMetaState>({});

  const setMeta = useCallback((next: DeskPageMetaState) => {
    setMetaState(next);
  }, []);

  const clearMeta = useCallback(() => {
    setMetaState({});
  }, []);

  const value = useMemo(
    () => ({ meta, setMeta, clearMeta }),
    [meta, setMeta, clearMeta]
  );

  return (
    <DeskPageChromeContext.Provider value={value}>
      {children}
    </DeskPageChromeContext.Provider>
  );
}

export function useDeskPageChrome() {
  const ctx = useContext(DeskPageChromeContext);
  if (!ctx) {
    throw new Error("useDeskPageChrome must be used within DeskPageChromeProvider");
  }
  return ctx;
}

/** Publishes page title/description into the site header. */
export function DeskPageMeta({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) {
  const { setMeta, clearMeta } = useDeskPageChrome();

  useEffect(() => {
    setMeta({ title, description });
    return () => clearMeta();
  }, [title, description, setMeta, clearMeta]);

  return null;
}
