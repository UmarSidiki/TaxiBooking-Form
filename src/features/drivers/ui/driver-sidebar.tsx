"use client";

import { DeskPlaqueSidebar } from "@/features/dashboard/ui/desk-plaque-sidebar";
import { DeskSidebarNav } from "@/features/dashboard/ui/desk-sidebar-nav";
import { driverNavGroups } from "@/features/drivers/lib/driver-nav";

export function DriverSidebar({ locale }: { locale: string }) {
  return (
    <DeskPlaqueSidebar
      locale={locale}
      subtitleKey="Sidebar.driver_portal"
      logoutCallbackUrl={`/${locale}/drivers/login`}
    >
      <DeskSidebarNav locale={locale} groups={driverNavGroups} />
    </DeskPlaqueSidebar>
  );
}
