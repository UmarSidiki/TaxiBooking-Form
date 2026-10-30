"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function RivieraThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const current = (document.documentElement.dataset.rivieraTheme as "light" | "dark") || "light";
    setTheme(current);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.rivieraTheme = next;
    try {
      localStorage.setItem("riviera-theme", next);
    } catch {}
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="h-10 min-w-10 px-2 inline-flex items-center justify-center rounded-md border border-[var(--rule2)] bg-[var(--sheet)]"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}