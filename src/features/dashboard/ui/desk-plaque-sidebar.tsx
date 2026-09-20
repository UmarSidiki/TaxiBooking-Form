"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/shared/ui/sidebar";
import { DeskNavUser } from "@/features/dashboard/ui/desk-nav-user";

export function DeskPlaqueSidebar({
  locale,
  subtitleKey,
  logoutCallbackUrl,
  children,
}: {
  locale: string;
  subtitleKey: string;
  logoutCallbackUrl: string;
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const name = process.env.NEXT_PUBLIC_WEBSITE_NAME ?? t("Auth.Desk.fallback_name");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-3">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="relative size-8 overflow-hidden rounded-md bg-sidebar-accent">
            <Image src="/icon.png" alt="" fill className="object-cover" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">
              {name}
            </p>
            <p className="text-xs text-sidebar-foreground/70">{t(subtitleKey)}</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>{children}</SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <DeskNavUser locale={locale} callbackUrl={logoutCallbackUrl} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
