"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";

import { LanguageSwitcher } from "@/shared/chrome/language-switcher";
import { SidebarTrigger } from "@/shared/ui/sidebar";

export function DeskChromeHeader() {
  const activeLocale = useLocale();
  const [date, setDate] = useState("");

  useEffect(() => {
    setDate(
      new Intl.DateTimeFormat(activeLocale, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date())
    );
  }, [activeLocale]);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-4">
      <SidebarTrigger className="min-h-11 min-w-11" />
      <div className="flex min-w-0 items-center gap-3">
        {date ? (
          <p className="hidden truncate text-sm text-muted-foreground sm:block">
            {date}
          </p>
        ) : null}
        <LanguageSwitcher />
      </div>
    </header>
  );
}
