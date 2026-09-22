"use client";

import { useTranslations } from "next-intl";

import { DeskMark } from "@/features/auth/ui/desk-mark";

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
    <Sidebar collapsible="icon" side={locale === "ar" ? "right" : "left"}>
      <SidebarHeader className="border-b border-sidebar-border p-3">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <DeskMark className="size-8" />
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">
              {name}
            </p>
            <p className="text-xs text-sidebar-foreground">{t(subtitleKey)}</p>
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
