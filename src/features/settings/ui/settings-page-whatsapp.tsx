"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { WhatsAppConfigForm } from "@/features/settings/ui/whatsapp-config-form";
import { WhatsAppDeliveryList } from "@/features/settings/ui/whatsapp-delivery-list";
import { WhatsAppLinkPanel } from "@/features/settings/ui/whatsapp-link-panel";
import { WhatsAppNotifyToggles } from "@/features/settings/ui/whatsapp-notify-toggles";
import { WhatsAppTemplates } from "@/features/settings/ui/whatsapp-templates";
import type { WhatsAppDeskConfig, WhatsAppDeskData } from "@/features/settings/ui/whatsapp-desk-types";
import { SettingsSection } from "@/features/settings/ui/settings-section";
import { DeskPageMeta } from "@/features/dashboard/ui/desk-page-chrome";
import { apiGet } from "@/shared/http/api";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

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

  if (loading) {
    return (
      <div role="status" aria-label={t("loading")} className="flex flex-col gap-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
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

  const sent = data.deliveries.filter((d) => d.status === "sent").length;
  const failed = data.deliveries.filter((d) => d.status === "failed").length;

  return (
    <div className="flex flex-col gap-6">
      <DeskPageMeta title={t("nav_whatsapp")} description={t("whatsapp_help")} />
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          [t("whatsapp_stat_confirmations"), data.config.enabled ? t("whatsapp_on") : t("whatsapp_off")],
          [t("whatsapp_stat_desk"), String(data.config.notifyNumbers.length)],
          [t("whatsapp_stat_recent"), t("whatsapp_stat_recent_value", { sent: sent, failed: failed })],
        ].map(([label, value]) => (
          <div key={label} className="desk-card rounded-2xl border border-border bg-card p-5">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <h2 className="-mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("whatsapp_group_setup")}</h2>
      <SettingsSection title={t("whatsapp_connection_title")} description={t("whatsapp_unofficial")}>
        <WhatsAppLinkPanel />
      </SettingsSection>
      <SettingsSection title={t("whatsapp_settings_title")} description={t("whatsapp_settings_help")}>
        <WhatsAppConfigForm config={data.config} onSaved={onConfig} />
      </SettingsSection>
      <SettingsSection title={t("whatsapp_assignee_title")} description={t("whatsapp_assignee_help")}>
        <WhatsAppNotifyToggles />
      </SettingsSection>
      <h2 className="-mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("whatsapp_group_messages")}</h2>
      <SettingsSection title={t("whatsapp_messages_title")} description={t("whatsapp_messages_help")}>
        <WhatsAppTemplates
          templates={data.templates}
          companyPhone={data.config.companyPhone}
          defaultLocale={data.config.defaultLocale}
          onChange={() => load(true)}
        />
      </SettingsSection>
      <SettingsSection title={t("whatsapp_deliveries")} description={t("whatsapp_deliveries_help")}>
        <WhatsAppDeliveryList deliveries={data.deliveries} />
      </SettingsSection>
    </div>
  );
}
