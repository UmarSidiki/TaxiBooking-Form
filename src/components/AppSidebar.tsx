"use client";

import Link from "next/link";
import { Calendar, Car, Home, PersonStanding, Settings } from "lucide-react";

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
import LogoutButton from "@/components/auth/LogoutButton";

const items = [
  {
    title: "Dashboard",
    href: (locale: string) => `/${locale}/dashboard`,
    icon: Home,
  },
  {
    title: "Rides",
    href: (locale: string) => `/${locale}/dashboard/rides`,
    icon: Calendar,
  },
  {
    title: "Fleet",
    href: (locale: string) => `/${locale}/dashboard/fleet`,
    icon: Car,
  },
  {
    title: "Partners",
    href: (locale: string) => `/${locale}/dashboard/partners`,
    icon: PersonStanding,
  },
  {
    title: "Settings",
    href: (locale: string) => `/${locale}/dashboard/settings`,
    icon: Settings,
  },
];

export function AppSidebar({ locale }: { locale: string }) {
  return (
    <Sidebar>
      <SidebarHeader>
        <h2 className="text-lg font-semibold">Dashboard Menu</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.href(locale)}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <LogoutButton callbackUrl={`/${locale}/dashboard/signin`} />
      </SidebarFooter>
    </Sidebar>
  );
}
