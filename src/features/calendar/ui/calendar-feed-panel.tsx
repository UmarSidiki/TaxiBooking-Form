"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";

export function CalendarFeedPanel() {
  const t = useTranslations("Calendar");
  const [url, setUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const create = async () => {
    setNotice(null);
    const response = await fetch("/api/calendar/link");
    const data = await response.json();
    if (!response.ok || !data.url) {
      setNotice(t("feed-error"));
      return;
    }
    setUrl(data.url);
    setNotice(t("feed-ready"));
  };

  const revoke = async () => {
    setNotice(null);
    const response = await fetch("/api/calendar/link", { method: "DELETE" });
    if (!response.ok) {
      setNotice(t("feed-error"));
      return;
    }
    setUrl(null);
    setNotice(t("feed-revoked"));
  };

  return (
    <section className="flex flex-col gap-3 rounded-md border border-border bg-card p-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" className="h-11" onClick={() => void create()}>
          {t("feed-create")}
        </Button>
        <Button type="button" variant="outline" className="h-11" onClick={() => void revoke()}>
          {t("feed-revoke")}
        </Button>
      </div>
      {url ? (
        <a className="break-all text-sm text-primary underline-offset-4 hover:underline" href={url}>
          {url}
        </a>
      ) : null}
      {notice ? <p role="status">{notice}</p> : null}
    </section>
  );
}
