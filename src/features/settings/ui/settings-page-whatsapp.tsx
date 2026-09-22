"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { WhatsAppConfigForm } from "@/features/settings/ui/whatsapp-config-form";
import { WhatsAppDeliveryList } from "@/features/settings/ui/whatsapp-delivery-list";
import { WhatsAppLinkPanel } from "@/features/settings/ui/whatsapp-link-panel";
import { WhatsAppTemplates } from "@/features/settings/ui/whatsapp-templates";
import type { WhatsAppDeskConfig, WhatsAppDeskData } from "@/features/settings/ui/whatsapp-desk-types";
import { SettingsSection } from "@/features/settings/ui/settings-section";
import { apiGet } from "@/shared/http/api";
import { Button } from "@/shared/ui/button";

export function SettingsPageWhatsapp() {
  const t = useTranslations("Dashboard.Settings");
  const [data, setData] = useState<WhatsAppDeskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setLoadError(false);
    try {
      const response = await apiGet<{ success: boolean; data: WhatsAppDeskData }>(
        "/api/settings/whatsapp"
      );
      if (response.success) setData(response.data);
      else setLoadError(true);
    } catch {
      setLoadError(true);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onConfig = (config: WhatsAppDeskConfig) => {
    setData((prev) => (prev ? { ...prev, config } : prev));
  };

  if (loading) return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  if (loadError || !data) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm" role="alert">
          {t("whatsapp_load_failed")}
        </p>
        <Button type="button" className="h-11 w-fit" onClick={() => void load()}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
          {t("nav_whatsapp")}
        </h1>
        <p className="max-w-xl text-pretty text-sm text-muted-foreground">{t("whatsapp_help")}</p>
      </div>
      <SettingsSection title={t("whatsapp_connection")} description={t("whatsapp_unofficial")}>
        <WhatsAppLinkPanel />
      </SettingsSection>
      <SettingsSection title={t("whatsapp_settings")}>
        <WhatsAppConfigForm config={data.config} onSaved={onConfig} />
      </SettingsSection>
      <SettingsSection title={t("whatsapp_messages")} description={t("whatsapp_messages_help")}>
        <WhatsAppTemplates
          templates={data.templates}
          companyPhone={data.config.companyPhone}
          defaultLocale={data.config.defaultLocale}
          onChange={() => load(true)}
        />
      </SettingsSection>
      <SettingsSection title={t("whatsapp_deliveries")}>
        <WhatsAppDeliveryList deliveries={data.deliveries} />
      </SettingsSection>
    </div>
  );
}
