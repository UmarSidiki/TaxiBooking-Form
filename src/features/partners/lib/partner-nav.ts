import { Car, CreditCard, LayoutDashboard, Truck, User } from "lucide-react";
import type { DeskNavGroup } from "@/features/dashboard/lib/sidebar-nav";

export const partnerNavGroups: DeskNavGroup[] = [
  {
    id: "work",
    labelKey: "Dashboard.Partners.Sidebar.operations",
    items: [
      {
        titleKey: "Dashboard.Partners.Sidebar.available-rides",
        href: (locale) => `/${locale}/partners/dashboard`,
        icon: LayoutDashboard,
        showWhen: "approved",
      },
      {
        titleKey: "Dashboard.Partners.Sidebar.my-rides",
        href: (locale) => `/${locale}/partners/rides`,
        icon: Car,
        showWhen: "approved",
      },
    ],
  },
  {
    id: "account",
    labelKey: "Dashboard.Partners.Sidebar.account_settings",
    items: [
      {
        titleKey: "Dashboard.Partners.Sidebar.billing",
        href: (locale) => `/${locale}/partners/billing`,
        icon: CreditCard,
        showWhen: "approved",
      },
      {
        titleKey: "Dashboard.Partners.Sidebar.vehicles",
        href: (locale) => `/${locale}/partners/fleet`,
        icon: Truck,
        showWhen: "approved",
      },
      {
        titleKey: "Dashboard.Partners.Sidebar.account",
        href: (locale) => `/${locale}/partners/account`,
        icon: User,
      },
    ],
  },
];
