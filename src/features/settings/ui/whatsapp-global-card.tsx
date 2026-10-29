"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { DeskSelect } from "@/features/dashboard/ui/desk-select";
import { whatsappLocales } from "@/features/settings/schema/whatsapp.schema";
import { WhatsAppDeskNumbersField } from "@/features/settings/ui/whatsapp-desk-numbers-field";
import { WhatsAppQuietHoursField } from "@/features/settings/ui/whatsapp-quiet-hours-field";
import type { WhatsAppDeskConfig } from "@/features/settings/ui/whatsapp-desk-types";
import { apiPut } from "@/shared/http/api";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";

function payload(config: WhatsAppDeskConfig): WhatsAppDeskConfig {
  return { ...config, notifyNumbers: config.notifyNumbers.map((item) => item.trim()).filter(Boolean) };
}

export function WhatsAppGlobalCard({
  config,
  onSaved,
}: {
  config: WhatsAppDeskConfig;
  onSaved: (config: WhatsAppDeskConfig) => void;
}) {
  const t = useTranslations("Dashboard.Settings");
  const uiLocale = useLocale();
  const [draft, setDraft] = useState(config);
  const [rateLimit, setRateLimit] = useState(String(config.sendRateLimit));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setDraft(config);
    setRateLimit(String(config.sendRateLimit));
  }, [config]);

  const next: WhatsAppDeskConfig = {
    ...payload(draft),
    sendRateLimit: Number(rateLimit) || 0,
  };
  const dirty = JSON.stringify(next) !== JSON.stringify(payload(config));
  const languageNames = new Intl.DisplayNames([uiLocale], { type: "language" });

  const save = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const response = await apiPut<{ success: boolean; data: WhatsAppDeskConfig }>(
        "/api/settings/whatsapp",
        next,
      );
      if (!response.success) {
        setNotice(t("whatsapp_save_failed"));
        return;
      }
      onSaved(next);
      setNotice(t("whatsapp_saved"));
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
          <span id="whatsapp-enabled-label" className="text-sm font-medium">
            {t("whatsapp_enabled")}
          </span>
          <span id="whatsapp-enabled-help" className="text-xs text-muted-foreground">
            {t("whatsapp_enabled_help")}
          </span>
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
        <div>
          <label htmlFor="whatsapp-rate-limit" className="mb-2 block text-sm font-medium">
            {t("notify_rate_limit")}
          </label>
          <Input
            id="whatsapp-rate-limit"
            name="sendRateLimit"
            type="number"
            min={0}
            max={120}
            inputMode="numeric"
            value={rateLimit}
            onChange={(event) => setRateLimit(event.target.value)}
          />
          <p className="mt-1 text-xs text-muted-foreground">{t("notify_rate_limit_help")}</p>
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
            onChange={(event) => setDraft((prev) => ({ ...prev, companyPhone: event.target.value }))}
          />
          <p className="mt-1 text-xs text-muted-foreground">{t("whatsapp_company_phone_help")}</p>
        </div>
      </div>

      <WhatsAppQuietHoursField
        value={draft.quietHours}
        onChange={(quietHours) => setDraft((prev) => ({ ...prev, quietHours }))}
      />
      <WhatsAppDeskNumbersField
        value={draft.notifyNumbers}
        onChange={(notifyNumbers) => setDraft((prev) => ({ ...prev, notifyNumbers }))}
      />
      <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/50 p-3">
        <span className="flex flex-col">
          <span id="whatsapp-opt-in-label" className="text-sm font-medium">
            {t("notify_opt_in")}
          </span>
          <span id="whatsapp-opt-in-help" className="text-xs text-muted-foreground">
            {t("notify_opt_in_help")}
          </span>
        </span>
        <Switch
          checked={draft.requireOptIn}
          aria-labelledby="whatsapp-opt-in-label"
          aria-describedby="whatsapp-opt-in-help"
          onCheckedChange={(requireOptIn) => setDraft((prev) => ({ ...prev, requireOptIn }))}
        />
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
                  setRateLimit(String(config.sendRateLimit));
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
