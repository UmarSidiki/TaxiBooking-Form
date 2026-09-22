"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { ApiError, apiPost } from "@/shared/http/api";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

export function WhatsAppTestSend({
  templateId,
  fieldId,
}: {
  templateId: string;
  fieldId: string;
}) {
  const t = useTranslations("Dashboard.Settings");
  const [to, setTo] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const send = async () => {
    if (!templateId) {
      setNotice(t("whatsapp_test_pick"));
      return;
    }
    setSending(true);
    setNotice(null);
    try {
      await apiPost("/api/settings/whatsapp/test", { templateId, to });
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
    <div className="flex flex-col gap-3">
      <label htmlFor={fieldId} className="text-sm font-medium">
        {t("whatsapp_test_to")}
      </label>
      <Input
        id={fieldId}
        name={fieldId}
        type="tel"
        autoComplete="tel"
        spellCheck={false}
        translate="no"
        value={to}
        onChange={(event) => setTo(event.target.value)}
      />
      <Button type="button" className="h-11 w-fit" onClick={send} disabled={sending || !to.trim()}>
        {sending ? t("whatsapp_testing") : t("whatsapp_test")}
      </Button>
      {notice ? (
        <p role="status" aria-live="polite" className="text-sm">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
