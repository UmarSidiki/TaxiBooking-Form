"use client";

import {
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";
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
  const [logoRatio, setLogoRatio] = useState<{
    url: string;
    value: number;
  } | null>(null);
  const showLogo = Boolean(logoUrl) && failedLogoUrl !== logoUrl;
  const ratio = logoRatio?.url === logoUrl ? logoRatio.value : null;
  const plateStyle = ratio
    ? ({ "--desk-logo-ratio": ratio } as CSSProperties)
    : undefined;

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
                <span
                  aria-hidden="true"
                  className="desk-brand__logo"
                  data-letter={showLogo ? undefined : ""}
                  style={plateStyle}
                >
                  {showLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl}
                      alt=""
                      onLoad={(event) => {
                        const { naturalWidth, naturalHeight } =
                          event.currentTarget;
                        if (naturalWidth > 0 && naturalHeight > 0) {
                          setLogoRatio({
                            url: logoUrl,
                            value: naturalWidth / naturalHeight,
                          });
                        }
                      }}
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
