"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { whatsappLocales } from "@/features/settings/schema/whatsapp.schema";
import type { WhatsAppDeskConfig } from "@/features/settings/ui/whatsapp-desk-types";
import { DeskSelect } from "@/features/dashboard/ui/desk-select";
import { apiPut } from "@/shared/http/api";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";

export function WhatsAppConfigForm({
  config,
  onSaved,
}: {
  config: WhatsAppDeskConfig;
  onSaved: (config: WhatsAppDeskConfig) => void;
}) {
  const t = useTranslations("Dashboard.Settings");
  const [draft, setDraft] = useState(config);
  const [numbers, setNumbers] = useState(config.notifyNumbers.join("\n"));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const dirty =
    draft.enabled !== config.enabled ||
    draft.defaultCallingCode !== config.defaultCallingCode ||
    draft.companyPhone !== config.companyPhone ||
    draft.defaultLocale !== config.defaultLocale ||
    numbers !== config.notifyNumbers.join("\n");

  useEffect(() => {
    const onLeave = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  const save = async () => {
    const notifyNumbers = numbers
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (notifyNumbers.length > 5) {
      setNotice(t("whatsapp_notify_limit"));
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const body = { ...draft, notifyNumbers };
      const data = await apiPut<{ success: boolean; data: WhatsAppDeskConfig }>(
        "/api/settings/whatsapp",
        body
      );
      if (data.success) {
        onSaved(body);
        setNotice(t("whatsapp_saved"));
      }
    } catch {
      setNotice(t("whatsapp_save_failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="whatsapp-enabled"
          className="size-4 accent-primary focus-visible:ring-2 focus-visible:ring-ring"
          checked={draft.enabled}
          onChange={(event) => setDraft((prev) => ({ ...prev, enabled: event.target.checked }))}
        />
        {t("whatsapp_enabled")}
      </label>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="whatsapp-calling-code" className="mb-2 block text-sm font-medium">
            {t("whatsapp_calling_code")}
          </label>
          <Input
            id="whatsapp-calling-code"
            name="defaultCallingCode"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            translate="no"
            placeholder="41"
            value={draft.defaultCallingCode}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, defaultCallingCode: event.target.value }))
            }
          />
          <p className="mt-1 text-xs text-muted-foreground">{t("whatsapp_calling_code_help")}</p>
        </div>
        <div>
          <label htmlFor="whatsapp-company-phone" className="mb-2 block text-sm font-medium">
            {t("whatsapp_company_phone")}
          </label>
          <Input
            id="whatsapp-company-phone"
            name="companyPhone"
            type="tel"
            autoComplete="tel"
            spellCheck={false}
            translate="no"
            value={draft.companyPhone}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, companyPhone: event.target.value }))
            }
          />
        </div>
      </div>
      <div>
        <label htmlFor="whatsapp-notify" className="mb-2 block text-sm font-medium">
          {t("whatsapp_notify")}
        </label>
        <Textarea
          id="whatsapp-notify"
          name="notifyNumbers"
          autoComplete="off"
          spellCheck={false}
          translate="no"
          value={numbers}
          onChange={(event) => setNumbers(event.target.value)}
        />
        <p className="mt-1 text-xs text-muted-foreground">{t("whatsapp_notify_help")}</p>
      </div>
      <div>
        <p className="mb-2 block text-sm font-medium">{t("whatsapp_default_locale")}</p>
        <DeskSelect
          value={draft.defaultLocale}
          ariaLabel={t("whatsapp_default_locale")}
          onValueChange={(value) => setDraft((prev) => ({ ...prev, defaultLocale: value }))}
          options={whatsappLocales.map((locale) => ({ value: locale, label: locale }))}
        />
      </div>
      {notice ? (
        <p className="text-sm" role="status" aria-live="polite">
          {notice}
        </p>
      ) : null}
      <Button type="button" className="h-11 w-fit" onClick={save} disabled={saving}>
        {saving ? t("whatsapp_saving") : t("whatsapp_save")}
      </Button>
    </div>
  );
}
