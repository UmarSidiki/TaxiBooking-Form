"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { DeskPageMeta } from "@/features/dashboard/ui/desk-page-chrome";
import type {
  RegistryEventRow,
  WhatsAppRegistryData,
} from "@/features/settings/lib/whatsapp-registry-types";
import { SettingsSection } from "@/features/settings/ui/settings-section";
import { WhatsAppConnectionCard } from "@/features/settings/ui/whatsapp-connection-card";
import { WhatsAppDeliveryList } from "@/features/settings/ui/whatsapp-delivery-list";
import { WhatsAppEventSheet } from "@/features/settings/ui/whatsapp-event-sheet";
import { WhatsAppGlobalCard } from "@/features/settings/ui/whatsapp-global-card";
import { WhatsAppRegistryList } from "@/features/settings/ui/whatsapp-registry-list";
import type { WhatsAppDeskConfig } from "@/features/settings/ui/whatsapp-desk-types";
import { apiGet } from "@/shared/http/api";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

export function SettingsPageWhatsapp() {
  const t = useTranslations("Dashboard.Settings");
  const [data, setData] = useState<WhatsAppRegistryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editing, setEditing] = useState<RegistryEventRow | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setLoadError(false);
    try {
      const response = await apiGet<{ success: boolean; data: WhatsAppRegistryData }>(
        "/api/settings/whatsapp/events"
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

  const onConfig = (config: WhatsAppDeskConfig) => {
    setData((prev) => (prev ? { ...prev, config } : prev));
  };

  return (
    <div className="flex flex-col gap-6">
      <DeskPageMeta title={t("nav_whatsapp")} description={t("notify_help")} />
      <SettingsSection
        title={t("notify_connection_title")}
        description={t("notify_connection_help")}
      >
        <WhatsAppConnectionCard config={data.config} />
      </SettingsSection>
      <SettingsSection
        title={t("notify_global_title")}
        description={t("notify_global_help")}
      >
        <WhatsAppGlobalCard config={data.config} onSaved={onConfig} />
      </SettingsSection>
      <WhatsAppRegistryList
        events={data.events}
        onEdit={setEditing}
        onChanged={() => void load(true)}
      />
      <SettingsSection
        title={t("whatsapp_deliveries")}
        description={t("whatsapp_deliveries_help")}
      >
        <WhatsAppDeliveryList deliveries={data.deliveries} />
      </SettingsSection>
      {editing ? (
        <WhatsAppEventSheet
          row={editing}
          companyPhone={data.config.companyPhone}
          defaultLocale={data.config.defaultLocale}
          onClose={() => setEditing(null)}
          onChanged={() => void load(true)}
        />
      ) : null}
    </div>
  );
}
