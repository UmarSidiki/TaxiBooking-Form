"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

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
    const response = await fetch("/api/settings/whatsapp/notify", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    if (!response.ok) setError(t("save-error"));
  };

  if (error) return <p role="alert">{error}</p>;
  if (!flags) return <p role="status">{t("loading")}</p>;

  return (
    <fieldset className="flex flex-col gap-3 rounded-md border border-border p-4">
      <legend className="px-1 text-sm font-semibold">{t("title")}</legend>
      {KEYS.map((key) => (
        <label key={key} className="flex min-h-11 items-center justify-between gap-3 text-sm">
          <span>{t(key)}</span>
          <input
            type="checkbox"
            checked={flags[key]}
            onChange={() => void toggle(key)}
            className="size-5"
          />
        </label>
      ))}
    </fieldset>
  );
}
