"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import type { ISetting } from "@/features/settings/model";
import { apiGet, apiPost } from "@/shared/http/api";
import { SettingsTodayPanel } from "@/features/settings/ui/settings-today-panel";
import { SettingsSetupPanel } from "@/features/settings/ui/settings-setup-panel";

export function SettingsDeskPage() {
  const t = useTranslations();
  const [settings, setSettings] = useState<Partial<ISetting>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [group, setGroup] = useState("today");

  useEffect(() => {
    const fetchSettings = async () => {
      setIsFetching(true);
      try {
        const data = await apiGet<{ success: boolean; data: Partial<ISetting> }>(
          "/api/settings"
        );
        if (data.success) {
          setSettings({
            ...data.data,
            enablePartners: data.data.enablePartners ?? false,
            enableDrivers: data.data.enableDrivers ?? false,
            enableEmbeddableForm: data.data.enableEmbeddableForm ?? false,
            enableFormBuilder: data.data.enableFormBuilder ?? false,
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        setNotice(t("Dashboard.Settings.failed-to-load-settings"));
      } finally {
        setIsFetching(false);
      }
    };
    fetchSettings();
  }, [t]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const data = await apiPost<{
        success: boolean;
        data?: Partial<ISetting>;
      }>("/api/settings", settings);
      if (data.success) {
        if (data.data) setSettings(data.data);
        window.dispatchEvent(
          new CustomEvent("settingsUpdated", { detail: data.data })
        );
        setNotice(t("Dashboard.Settings.settings-saved-successfully"));
      } else {
        setNotice(t("Dashboard.Settings.failed-to-save-settings"));
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setNotice(t("Dashboard.Settings.failed-to-save-settings"));
    } finally {
      setIsLoading(false);
    }
  };

  const patch = (key: keyof ISetting, value: ISetting[keyof ISetting]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const panelProps = {
    settings,
    patch,
    setSettings,
    isLoading,
    setIsLoading,
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <Loader2 className="me-2 size-5 animate-spin" />
        {t("Dashboard.Settings.loading")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("Dashboard.Settings.settings")}
        </h1>
        <Button onClick={handleSubmit} disabled={isLoading} className="h-11">
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {isLoading
            ? t("Dashboard.Settings.saving")
            : t("Dashboard.Settings.save-all-settings")}
        </Button>
      </div>
      {notice ? (
        <p className="rounded-md border border-border bg-card px-4 py-3 text-sm" role="status">
          {notice}
        </p>
      ) : null}
      <Tabs value={group} onValueChange={setGroup}>
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-muted p-1">
          <TabsTrigger value="today" className="min-h-11">
            {t("Dashboard.Settings.today")}
          </TabsTrigger>
          <TabsTrigger value="setup" className="min-h-11">
            {t("Dashboard.Settings.setup")}
          </TabsTrigger>
        </TabsList>
        <p className="text-sm text-muted-foreground">
          {group === "today"
            ? t("Dashboard.Settings.today_help")
            : t("Dashboard.Settings.setup_help")}
        </p>
        <TabsContent value="today">
          <SettingsTodayPanel {...panelProps} />
        </TabsContent>
        <TabsContent value="setup">
          <SettingsSetupPanel {...panelProps} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
