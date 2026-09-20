"use client";

import { useEffect, useState } from "react";

import type { ISetting } from "@/features/settings/model";
import { DeskPlaqueSidebar } from "@/features/dashboard/ui/desk-plaque-sidebar";
import { DeskSidebarNav } from "@/features/dashboard/ui/desk-sidebar-nav";

export function AppSidebar({ locale }: { locale: string }) {
  const [settings, setSettings] = useState<Partial<ISetting>>({
    enablePartners: false,
    enableDrivers: false,
    enableFormBuilder: true,
    enableEmbeddableForm: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
        const data = await response.json();
        if (data.success) setSettings(data.data);
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    fetchSettings();
    const onUpdate = (event: Event) => {
      const custom = event as CustomEvent<Partial<ISetting> | undefined>;
      if (custom.detail) setSettings(custom.detail);
      else fetchSettings();
    };
    window.addEventListener("settingsUpdated", onUpdate);
    return () => window.removeEventListener("settingsUpdated", onUpdate);
  }, []);

  return (
    <DeskPlaqueSidebar
      locale={locale}
      subtitleKey="Auth.Desk.operations"
      logoutCallbackUrl={`/${locale}/dashboard/signin`}
    >
      <DeskSidebarNav locale={locale} settings={settings} />
    </DeskPlaqueSidebar>
  );
}
