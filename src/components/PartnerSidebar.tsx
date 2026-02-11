"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LayoutDashboard, Car, User, History, Truck, CreditCard, BarChart3, Calendar } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import LogoutButton from "@/components/auth/LogoutButton";
import { Separator } from "@/components/ui/separator";

export function PartnerSidebar({ locale }: { locale: string }) {
  const t = useTranslations("Dashboard.Partners.Sidebar");
  const pathname = usePathname();
  const [isApproved, setIsApproved] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchPartnerStatus = async () => {
      try {
        const response = await fetch("/api/partners/profile");
        const data = await response.json();
        if (response.ok) {
          setIsApproved(data.partner.status === "approved");
        }
      } catch (error) {
        console.error("Error fetching partner status:", error);
      }
    };

    fetchPartnerStatus();
  }, []);
  
  // Overview - Dashboard and stats
  const overviewItems = [
    {
      title: t("dashboard"),
      href: (locale: string) => `/${locale}/partners/dashboard`,
      icon: LayoutDashboard,
      showAlways: false,
    },
  ];

  // Operations - Rides management
  const operationsItems = [
    {
      title: t("rides"),
      href: (locale: string) => `/${locale}/partners/rides`,
      icon: Car,
      showAlways: false,
    },
    {
      title: t("history"),
      href: (locale: string) => `/${locale}/partners/history`,
      icon: History,
      showAlways: false,
    },
  ];

  // Fleet Management
  const fleetItems = [
    {
      title: t("fleet"),
      href: (locale: string) => `/${locale}/partners/fleet`,
      icon: Truck,
      showAlways: false,
    },
  ];

  // Account & Business
  const accountItems = [
    {
      title: t("account"),
      href: (locale: string) => `/${locale}/partners/account`,
      icon: User,
      showAlways: true,
    },
    {
      title: t("billing"),
      href: (locale: string) => `/${locale}/partners/billing`,
      icon: CreditCard,
      showAlways: true,
    },
  ];

  return (
    <Sidebar className="border-r-2 border-border/50">
      <SidebarHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10 p-6">
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-primary/10 border border-primary/20">
            <Image
              src="/icon.png"
              alt="Partner Portal Logo"
              fill
              className="object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML =
                    '<div class="flex h-full w-full items-center justify-center"><svg class="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg></div>';
                }
              }}
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {process.env.NEXT_PUBLIC_WEBSITE_NAME || t("partner-portal")}
            </h1>
            <p className="text-xs text-muted-foreground">{t("partner-portal")}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-3">
        {isApproved && (
          <>
            {/* Overview Section */}
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t("overview")}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5">
                  {overviewItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href(locale)}
                        className="h-10 px-3 rounded-lg transition-all duration-200 [&:hover_svg]:text-primary [&[data-active=true]_svg]:text-primary"
                      >
                        <Link
                          href={item.href(locale)}
                          className="flex items-center gap-3"
                        >
                          <item.icon className="h-5 w-5 text-muted-foreground transition-colors" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <Separator className="my-1" />

            {/* Operations Section */}
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t("operations")}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5">
                  {operationsItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href(locale)}
                        className="h-10 px-3 rounded-lg transition-all duration-200 [&:hover_svg]:text-primary [&[data-active=true]_svg]:text-primary"
                      >
                        <Link
                          href={item.href(locale)}
                          className="flex items-center gap-3"
                        >
                          <item.icon className="h-5 w-5 text-muted-foreground transition-colors" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <Separator className="my-1" />

            {/* Fleet Section */}
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t("fleet_management")}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5">
                  {fleetItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href(locale)}
                        className="h-10 px-3 rounded-lg transition-all duration-200 [&:hover_svg]:text-primary [&[data-active=true]_svg]:text-primary"
                      >
                        <Link
                          href={item.href(locale)}
                          className="flex items-center gap-3"
                        >
                          <item.icon className="h-5 w-5 text-muted-foreground transition-colors" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <Separator className="my-1" />
          </>
        )}

        {/* Account Section - Always visible */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {t("account_settings")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href(locale)}
                    className="h-10 px-3 rounded-lg transition-all duration-200 [&:hover_svg]:text-primary [&[data-active=true]_svg]:text-primary"
                  >
                    <Link
                      href={item.href(locale)}
                      className="flex items-center gap-3"
                    >
                      <item.icon className="h-5 w-5 text-muted-foreground transition-colors" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 bg-muted/30 p-4">
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2">
              Language
            </p>
            <LanguageSwitcher />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              © 2025 {process.env.NEXT_PUBLIC_WEBSITE_NAME || t("partner-portal")}
            </div>
            <LogoutButton callbackUrl={`/${locale}/partners/login`} />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
