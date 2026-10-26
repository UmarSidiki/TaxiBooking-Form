"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Switch } from "@/shared/ui/switch";

const KEYS = [
  "whatsappTplAssigned",
  "whatsappTplAvailable",
  "whatsappTplChanged",
  "whatsappTplReminder",
  "whatsappTplSettlement",
] as const;

type Key = (typeof KEYS)[number];

export function WhatsAppNotifyToggles() {
  const t = useTranslations("WhatsAppNotify");
  const [flags, setFlags] = useState<Record<Key, boolean> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void fetch("/api/settings/whatsapp/notify")
      .then((response) => response.json())
      .then((body) => {
        if (body.success) setFlags(body.flags);
        else setError(t("load-error"));
      })
      .catch(() => setError(t("load-error")));
  }, [t]);

  const toggle = async (key: Key) => {
    if (!flags) return;
    const next = { ...flags, [key]: !flags[key] };
    setFlags(next);
    setSaved(false);
    setError(null);
    const response = await fetch("/api/settings/whatsapp/notify", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    if (!response.ok) {
      setFlags(flags);
      setError(t("save-error"));
    } else setSaved(true);
  };

  if (!flags && error) return <p role="alert">{error}</p>;
  if (!flags) return <p role="status">{t("loading")}</p>;

  return (
    <div className="flex flex-col gap-1">
      <ul className="flex flex-col gap-2">
        {KEYS.map((key) => (
          <li key={key} className="flex min-h-14 items-center justify-between gap-4 rounded-xl bg-muted/50 px-3 py-2">
            <span className="flex flex-col">
              <span className="text-sm font-medium" id={`notify-${key}`}>{t(key)}</span>
              <span className="text-xs text-muted-foreground">{t(`${key}-help`)}</span>
            </span>
            <Switch checked={flags[key]} aria-labelledby={`notify-${key}`} onCheckedChange={() => void toggle(key)} />
          </li>
        ))}
      </ul>
      <p role="status" aria-live="polite" className={`min-h-5 text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}>
        {error ?? (saved ? t("saved") : "")}
      </p>
    </div>
  );
}
