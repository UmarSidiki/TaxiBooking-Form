"use client";

import { useEffect, useState } from "react";

import { DeskPlaqueSidebar } from "@/features/dashboard/ui/desk-plaque-sidebar";
import { DeskSidebarNav } from "@/features/dashboard/ui/desk-sidebar-nav";
import { partnerNavGroups } from "@/features/partners/lib/partner-nav";

export function PartnerSidebar({ locale }: { locale: string }) {
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/partners/profile");
        const data = await response.json();
        if (response.ok) setApproved(data.partner.status === "approved");
      } catch (error) {
        console.error("Error fetching partner status:", error);
      }
    };
    load();
  }, []);

  return (
    <DeskPlaqueSidebar
      locale={locale}
      subtitleKey="Dashboard.Partners.Sidebar.partner-portal"
      logoutCallbackUrl={`/${locale}/partners/login`}
    >
      <DeskSidebarNav locale={locale} groups={partnerNavGroups} approved={approved} />
    </DeskPlaqueSidebar>
  );
}
