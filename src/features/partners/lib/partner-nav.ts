import {
  LayoutDashboard,
  Car,
  History,
  Truck,
  User,
  CreditCard,
} from "lucide-react";

import type { DeskNavGroup } from "@/features/dashboard/lib/sidebar-nav";

export const partnerNavGroups: DeskNavGroup[] = [
  {
    id: "overview",
    labelKey: "Dashboard.Partners.Sidebar.overview",
    items: [
      {
        titleKey: "Dashboard.Partners.Sidebar.dashboard",
        href: (locale) => `/${locale}/partners/dashboard`,
        icon: LayoutDashboard,
        showWhen: "approved",
      },
    ],
  },
  {
    id: "operations",
    labelKey: "Dashboard.Partners.Sidebar.operations",
    items: [
      {
        titleKey: "Dashboard.Partners.Sidebar.rides",
        href: (locale) => `/${locale}/partners/rides`,
        icon: Car,
        showWhen: "approved",
      },
      {
        titleKey: "Dashboard.Partners.Sidebar.history",
        href: (locale) => `/${locale}/partners/history`,
        icon: History,
        showWhen: "approved",
      },
    ],
  },
  {
    id: "fleet",
    labelKey: "Dashboard.Partners.Sidebar.fleet_management",
    items: [
      {
        titleKey: "Dashboard.Partners.Sidebar.fleet",
        href: (locale) => `/${locale}/partners/fleet`,
        icon: Truck,
        showWhen: "approved",
      },
    ],
  },
  {
    id: "account",
    labelKey: "Dashboard.Partners.Sidebar.account_settings",
    items: [
      {
        titleKey: "Dashboard.Partners.Sidebar.account",
        href: (locale) => `/${locale}/partners/account`,
        icon: User,
      },
      {
        titleKey: "Dashboard.Partners.Sidebar.billing",
        href: (locale) => `/${locale}/partners/billing`,
        icon: CreditCard,
      },
    ],
  },
];
