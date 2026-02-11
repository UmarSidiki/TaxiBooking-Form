"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, User, Settings } from "lucide-react";

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
import { useTranslations } from "next-intl";

export function DriverSidebar({ locale }: { locale: string }) {
  const t = useTranslations();
  const pathname = usePathname();

  const overviewItems = [
    {
      title: t("Sidebar.dashboard"),
      href: (locale: string) => `/${locale}/drivers/dashboard`,
      icon: LayoutDashboard,
    },
  ];

  const ridesItems = [
    {
      title: t("Sidebar.rides"),
      href: (locale: string) => `/${locale}/drivers/dashboard`,
      icon: Calendar,
    },
  ];

  const accountItems = [
    {
      title: t("Sidebar.account"),
      href: (locale: string) => `/${locale}/drivers/dashboard`,
      icon: User,
    },
  ];

  return (
    <Sidebar className="border-r-2 border-border/50">
      <SidebarHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10 p-6">
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-primary/10 border border-primary/20">
            <Image
              src="/icon.png"
              alt="Driver Portal Logo"
              fill
              className="object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML =
                    '<div class="flex h-full w-full items-center justify-center"><svg class="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>';
                }
              }}
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {process.env.NEXT_PUBLIC_WEBSITE_NAME}
            </h1>
            <p className="text-xs text-muted-foreground">{t("Sidebar.driver_portal")}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-3">
        {/* Overview Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {t("Sidebar.overview")}
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

        <Separator className="my-2" />

        {/* Rides Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {t("Sidebar.my_assignments")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {ridesItems.map((item) => (
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

        <Separator className="my-2" />

        {/* Account Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {t("Sidebar.account")}
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
              {t("Sidebar.welcome")}
            </p>
            <LanguageSwitcher />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              © 2025 {process.env.NEXT_PUBLIC_WEBSITE_NAME}
            </div>
            <LogoutButton callbackUrl={`/${locale}/drivers/login`} />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
