"use client";

import {
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { useBrandIdentity } from "@/features/settings/ui/brand-logo";
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
  const brand = useBrandIdentity(t("Auth.Desk.fallback_name"));
  const name = brand.name;
  const subtitle = t(subtitleKey);
  const href = homeHref ?? `/${locale}/dashboard/home`;
  const logoUrl = brand.logoUrl;
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const [logoRatio, setLogoRatio] = useState<{
    url: string;
    value: number;
  } | null>(null);
  const showLogo = Boolean(logoUrl) && failedLogoUrl !== logoUrl;
  const measure = (img: HTMLImageElement) => {
    const { naturalWidth, naturalHeight } = img;
    if (naturalWidth > 0 && naturalHeight > 0 && (logoRatio?.url !== logoUrl || logoRatio.value !== naturalWidth / naturalHeight)) {
      setLogoRatio({ url: logoUrl, value: naturalWidth / naturalHeight });
    }
  };
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
                      // Server-rendered logos can finish loading before hydration, so read the size on mount too.
                      ref={(img) => {
                        if (img?.complete) measure(img);
                      }}
                      onLoad={(event) => measure(event.currentTarget)}
                      onError={() => setFailedLogoUrl(logoUrl)}
                    />
                  ) : (
                    brand.initial
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
