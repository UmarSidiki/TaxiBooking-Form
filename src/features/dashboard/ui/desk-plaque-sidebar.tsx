"use client";
import { brandName } from "@/features/settings/lib/brand-name";

import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { useOptionalSettingsDesk } from "@/features/settings/ui/settings-desk-context";
import { DeskNavUser } from "@/features/dashboard/ui/desk-nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/ui/sidebar";

export function DeskPlaqueSidebar({
  locale,
  subtitleKey,
  logoutCallbackUrl,
  homeHref,
  children,
  ...props
}: {
  locale: string;
  subtitleKey: string;
  logoutCallbackUrl: string;
  homeHref?: string;
  children: ReactNode;
} & ComponentProps<typeof Sidebar>) {
  const t = useTranslations();
  const settings = useOptionalSettingsDesk()?.settings;
  const name = brandName(settings) || t("Auth.Desk.fallback_name");
  const href = homeHref ?? `/${locale}/dashboard/home`;

  return (
    <Sidebar
      collapsible="offcanvas"
      variant="inset"
      side={locale === "ar" ? "right" : "left"}
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href={href}>
                <span className="relative size-8 shrink-0 rounded-full border-2 border-[var(--ink)] bg-[var(--sheet)]">
                  <span className="absolute inset-0 m-auto size-2 rounded-full bg-[var(--sig)]" />
                </span>
                <span className="text-base font-semibold text-sidebar-foreground">
                  {name}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <p className="truncate px-2 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
          {t(subtitleKey)}
        </p>
      </SidebarHeader>
      <SidebarContent>{children}</SidebarContent>
      <SidebarFooter>
        <DeskNavUser locale={locale} callbackUrl={logoutCallbackUrl} />
      </SidebarFooter>
    </Sidebar>
  );
}
