"use client";

import type { ISetting } from "@/features/settings/model";
import { useSettingsDesk } from "@/features/settings/ui/settings-desk-context";
import { DeskPlaqueSidebar } from "@/features/dashboard/ui/desk-plaque-sidebar";
import { DeskSidebarNav } from "@/features/dashboard/ui/desk-sidebar-nav";

const FALLBACK_SETTINGS: Partial<ISetting> = {
  enablePartners: false,
  enableDrivers: false,
  enableFormBuilder: true,
  enableEmbeddableForm: true,
};

export function AppSidebar({ locale }: { locale: string }) {
  const { settings, isFetching } = useSettingsDesk();

  return (
    <DeskPlaqueSidebar
      locale={locale}
      subtitleKey="Auth.Desk.operations"
      logoutCallbackUrl={`/${locale}/dashboard/signin`}
    >
      <DeskSidebarNav
        locale={locale}
        settings={isFetching ? FALLBACK_SETTINGS : settings}
      />
    </DeskPlaqueSidebar>
  );
}
