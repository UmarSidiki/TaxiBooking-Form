"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { brandName } from "@/features/settings/lib/brand-name";
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
  const subtitle = t(subtitleKey);
  const href = homeHref ?? `/${locale}/dashboard/home`;
  const logoUrl = settings?.companyLogoUrl?.trim() ?? "";
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const showLogo = Boolean(logoUrl) && failedLogoUrl !== logoUrl;

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
            <SidebarMenuButton asChild className="desk-brand min-h-11 p-1.5 text-start">
              <Link href={href}>
                <span aria-hidden="true" className="desk-brand__logo" data-letter={showLogo ? undefined : ""}>
                  {showLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl}
                      alt=""
                      width={32}
                      height={32}
                      onError={() => setFailedLogoUrl(logoUrl)}
                    />
                  ) : (
                    name.trim().charAt(0).toUpperCase()
                  )}
                </span>
                <span className="desk-brand__text group-data-[collapsible=icon]:hidden">
                  <span className="desk-brand__name" title={name}>
                    {name}
                  </span>
                  <span className="desk-brand__sub" title={subtitle}>
                    {subtitle}
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>{children}</SidebarContent>
      <SidebarFooter>
        <DeskNavUser locale={locale} callbackUrl={logoutCallbackUrl} />
      </SidebarFooter>
    </Sidebar>
  );
}
