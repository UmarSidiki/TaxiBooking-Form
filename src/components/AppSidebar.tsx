"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, Car, Home, Settings, Users } from "lucide-react";

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

export function AppSidebar({ locale }: { locale: string }) {
  const t = useTranslations();
  const items = [
    {
      title: t("Sidebar.dashboard"),
      href: (locale: string) => `/${locale}/dashboard`,
      icon: Home,
    },
    {
      title: t("Sidebar.rides"),
      href: (locale: string) => `/${locale}/dashboard/rides`,
      icon: Calendar,
    },
    {
      title: t("Sidebar.fleet"),
      href: (locale: string) => `/${locale}/dashboard/fleet`,
      icon: Car,
    },
    {
      title: "Drivers",
      href: (locale: string) => `/${locale}/dashboard/drivers`,
      icon: Users,
    },
    // {
    //   title: t("Sidebar.partners"),
    //   href: (locale: string) => `/${locale}/dashboard/partners`,
    //   icon: PersonStanding,
    // },
    {
      title: t("Sidebar.settings"),
      href: (locale: string) => `/${locale}/dashboard/settings`,
      icon: Settings,
    },
  ];

  return (
    <Sidebar className="border-r-2 border-border/50">
      <SidebarHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10 p-6">
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-primary/10 border border-primary/20">
            <Image
              src="/icon.png"
              alt="TaxiBooking Logo"
              fill
              className="object-cover"
              onError={(e) => {
                // Fallback to building icon if image fails to load
                e.currentTarget.style.display = "none";
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML =
                    '<div class="flex h-full w-full items-center justify-center"><svg class="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg></div>';
                }
              }}
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{process.env.NEXT_PUBLIC_WEBSITE_NAME}</h1>
            <p className="text-xs text-muted-foreground">{t("Sidebar.management_portal")}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t("Sidebar.navigation")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="h-11 px-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200 group"
                  >
                    <Link
                      href={item.href(locale)}
                      className="flex items-center gap-3"
                    >
                      <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-6" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {t('Sidebar.preferences')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-3">
              <LanguageSwitcher />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            © 2025 {process.env.NEXT_PUBLIC_WEBSITE_NAME}
          </div>
          <LogoutButton callbackUrl={`/${locale}/dashboard/signin`} />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
