"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { DeskSelect } from "@/features/dashboard/ui/desk-select";
import { whatsappLocales } from "@/features/settings/schema/whatsapp.schema";
import type { WhatsAppDeskConfig } from "@/features/settings/ui/whatsapp-desk-types";
import { apiPut } from "@/shared/http/api";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";

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
  const cleanNumbers = numbers.map((item) => item.trim()).filter(Boolean);
  const dirty =
    JSON.stringify({ ...draft, notifyNumbers: cleanNumbers }) !==
    JSON.stringify({ ...config, notifyNumbers: config.notifyNumbers });
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
      } else setNotice(t("whatsapp_save_failed"));
    } catch {
      setNotice(t("whatsapp_save_failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/50 p-3">
        <span className="flex flex-col">
          <span id="whatsapp-enabled-label" className="text-sm font-medium">{t("whatsapp_enabled")}</span>
          <span id="whatsapp-enabled-help" className="text-xs text-muted-foreground">{t("whatsapp_enabled_help")}</span>
        </span>
        <Switch
          checked={draft.enabled}
          aria-labelledby="whatsapp-enabled-label"
          aria-describedby="whatsapp-enabled-help"
          onCheckedChange={(enabled) => {
            setDraft((prev) => ({ ...prev, enabled }));
            setNotice(null);
          }}
        />
      </div>
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
      {dirty || notice ? (
        <div className="sticky bottom-0 z-30 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t border-border bg-card/95 px-4 pt-3 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="mr-auto text-sm text-muted-foreground" role="status" aria-live="polite">
            {notice ?? t("whatsapp_unsaved")}
          </p>
          {dirty ? (
            <>
              <Button
                type="button"
                variant="ghost"
                className="h-11"
                disabled={saving}
                onClick={() => {
                  setDraft(config);
                  setNumbers(config.notifyNumbers.length > 0 ? config.notifyNumbers : [""]);
                }}
              >
                {t("whatsapp_discard")}
              </Button>
              <Button type="button" className="h-11" onClick={save} disabled={saving}>
                {saving ? t("whatsapp_saving") : t("whatsapp_save")}
              </Button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
