"use client";

import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { DeskMark } from "@/features/auth/ui/desk-mark";
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
  const name = process.env.NEXT_PUBLIC_WEBSITE_NAME ?? t("Auth.Desk.fallback_name");
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
                <DeskMark className="size-8" />
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
