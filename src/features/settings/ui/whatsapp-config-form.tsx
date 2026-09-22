"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { DeskSelect } from "@/features/dashboard/ui/desk-select";
import { whatsappLocales } from "@/features/settings/schema/whatsapp.schema";
import type { WhatsAppDeskConfig } from "@/features/settings/ui/whatsapp-desk-types";
import { apiPut } from "@/shared/http/api";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

const MAX_NUMBERS = 5;

export function WhatsAppConfigForm({
  config,
  onSaved,
}: {
  config: WhatsAppDeskConfig;
  onSaved: (config: WhatsAppDeskConfig) => void;
}) {
  const t = useTranslations("Dashboard.Settings");
  const uiLocale = useLocale();
  const [draft, setDraft] = useState(config);
  const [numbers, setNumbers] = useState<string[]>(
    config.notifyNumbers.length > 0 ? config.notifyNumbers : [""]
  );
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const languageNames = new Intl.DisplayNames([uiLocale], { type: "language" });

  useEffect(() => {
    setDraft(config);
    setNumbers(config.notifyNumbers.length > 0 ? config.notifyNumbers : [""]);
  }, [config]);

  const save = async () => {
    const notifyNumbers = numbers.map((item) => item.trim()).filter(Boolean);
    if (notifyNumbers.length > MAX_NUMBERS) {
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
    <div className="flex flex-col gap-5">
      <label className="flex min-h-11 items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="whatsapp-enabled"
          className="mt-1 size-4 accent-primary focus-visible:ring-2 focus-visible:ring-ring"
          checked={draft.enabled}
          onChange={(event) => setDraft((prev) => ({ ...prev, enabled: event.target.checked }))}
        />
        <span>
          <span className="font-medium">{t("whatsapp_enabled")}</span>
          <span className="mt-1 block text-muted-foreground">{t("whatsapp_enabled_help")}</span>
        </span>
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
          <p className="mb-2 text-sm font-medium">{t("whatsapp_default_locale")}</p>
          <DeskSelect
            value={draft.defaultLocale}
            ariaLabel={t("whatsapp_default_locale")}
            onValueChange={(value) => setDraft((prev) => ({ ...prev, defaultLocale: value }))}
            options={whatsappLocales.map((locale) => ({
              value: locale,
              label: languageNames.of(locale) ?? locale,
            }))}
          />
          <p className="mt-1 text-xs text-muted-foreground">{t("whatsapp_fallback_help")}</p>
        </div>
      </div>
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">{t("whatsapp_notify")}</legend>
        <p className="text-xs text-muted-foreground">{t("whatsapp_notify_help")}</p>
        {numbers.map((number, index) => (
          <div key={index} className="flex items-center gap-2">
            <label className="sr-only" htmlFor={`whatsapp-desk-${index}`}>
              {t("whatsapp_number_label")} {index + 1}
            </label>
            <Input
              id={`whatsapp-desk-${index}`}
              name={`deskNumber-${index}`}
              type="tel"
              autoComplete="tel"
              spellCheck={false}
              translate="no"
              value={number}
              onChange={(event) =>
                setNumbers((prev) => prev.map((item, i) => (i === index ? event.target.value : item)))
              }
            />
            <Button
              type="button"
              variant="outline"
              className="h-11 shrink-0"
              onClick={() => setNumbers((prev) => prev.filter((_, i) => i !== index))}
              disabled={numbers.length === 1 && number === ""}
            >
              {t("whatsapp_remove_number")}
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          className="h-11 w-fit"
          disabled={numbers.length >= MAX_NUMBERS}
          onClick={() => setNumbers((prev) => [...prev, ""])}
        >
          {t("whatsapp_add_number")}
        </Button>
      </fieldset>
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
          onChange={(event) => setDraft((prev) => ({ ...prev, companyPhone: event.target.value }))}
        />
        <p className="mt-1 text-xs text-muted-foreground">{t("whatsapp_company_phone_help")}</p>
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
