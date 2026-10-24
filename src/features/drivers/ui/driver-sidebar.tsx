"use client";

import { useEffect, useState } from "react";

import { DeskPlaqueSidebar } from "@/features/dashboard/ui/desk-plaque-sidebar";
import { DeskSidebarNav } from "@/features/dashboard/ui/desk-sidebar-nav";
import { driverWorks } from "@/features/drivers/lib/driver-approval";
import { driverNavGroups } from "@/features/drivers/lib/driver-nav";

export function DriverSidebar({ locale }: { locale: string }) {
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/drivers/me");
        const data = await response.json();
        if (response.ok) setApproved(driverWorks(data.data?.status));
      } catch (error) {
        console.error("Error fetching driver status:", error);
      }
    };
    void load();
  }, []);

  return (
    <DeskPlaqueSidebar
      locale={locale}
      subtitleKey="Sidebar.driver_portal"
      logoutCallbackUrl={`/${locale}/drivers/login`}
      homeHref={approved ? `/${locale}/drivers/dashboard` : `/${locale}/drivers/account`}
    >
      <DeskSidebarNav locale={locale} groups={driverNavGroups} approved={approved} />
    </DeskPlaqueSidebar>
  );
}
