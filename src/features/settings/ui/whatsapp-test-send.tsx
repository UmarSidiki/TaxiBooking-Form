"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { ApiError, apiPost } from "@/shared/http/api";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type Target =
  | { templateId: string }
  | { event: string; audience: "customer" | "desk" | "driver" | "partner"; locale?: string };

export function WhatsAppTestSend({
  target,
  fieldId,
}: {
  target: Target;
  fieldId: string;
}) {
  const t = useTranslations("Dashboard.Settings");
  const [to, setTo] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const send = async () => {
    setSending(true);
    setNotice(null);
    try {
      await apiPost("/api/settings/whatsapp/test", { ...target, to });
      setNotice(t("whatsapp_test_ok"));
    } catch (error) {
      const code = error instanceof ApiError ? error.code : "";
      if (code === "needs_scan") setNotice(t("whatsapp_needs_scan"));
      else if (code === "invalid_phone") setNotice(t("whatsapp_invalid_phone"));
      else setNotice(t("whatsapp_test_failed"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={fieldId} className="text-sm font-medium">
        {t("whatsapp_test_to")}
      </label>
      <div className="flex flex-wrap items-end gap-2">
        <Input
          id={fieldId}
          name={fieldId}
          type="tel"
          autoComplete="tel"
          spellCheck={false}
          translate="no"
          className="max-w-56"
          value={to}
          onChange={(event) => setTo(event.target.value)}
        />
        <Button type="button" className="h-11" onClick={send} disabled={sending || !to.trim()}>
          {sending ? t("whatsapp_testing") : t("whatsapp_test")}
        </Button>
      </div>
      {notice ? (
        <p role="status" aria-live="polite" className="text-sm">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
