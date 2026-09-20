import {
  Blocks,
  Calendar,
  Car,
  Code,
  LayoutDashboard,
  Settings,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export type DeskNavFlag = "drivers" | "partners" | "formBuilder" | "embed";

export type DeskNavItem = {
  titleKey: string;
  href: (locale: string) => string;
  icon: LucideIcon;
  flag?: DeskNavFlag;
  showWhen?: "approved";
};

export type DeskNavGroup = {
  id: string;
  labelKey: string;
  items: DeskNavItem[];
};

export const deskNavGroups: DeskNavGroup[] = [
  {
    id: "dispatch",
    labelKey: "Sidebar.dispatch",
    items: [
      {
        titleKey: "Sidebar.dashboard",
        href: (locale) => `/${locale}/dashboard/home`,
        icon: LayoutDashboard,
      },
      {
        titleKey: "Sidebar.rides",
        href: (locale) => `/${locale}/dashboard/rides`,
        icon: Calendar,
      },
    ],
  },
  {
    id: "capacity",
    labelKey: "Sidebar.capacity",
    items: [
      {
        titleKey: "Sidebar.fleet",
        href: (locale) => `/${locale}/dashboard/fleet`,
        icon: Car,
      },
      {
        titleKey: "Sidebar.drivers",
        href: (locale) => `/${locale}/dashboard/drivers`,
        icon: Users,
        flag: "drivers",
      },
    ],
  },
  {
    id: "network",
    labelKey: "Sidebar.network",
    items: [
      {
        titleKey: "Sidebar.partners",
        href: (locale) => `/${locale}/dashboard/partners`,
        icon: UsersRound,
        flag: "partners",
      },
    ],
  },
  {
    id: "booking_site",
    labelKey: "Sidebar.booking_site",
    items: [
      {
        titleKey: "Sidebar.form_builder",
        href: (locale) => `/${locale}/dashboard/form-builder`,
        icon: Blocks,
        flag: "formBuilder",
      },
      {
        titleKey: "Sidebar.embed_forms",
        href: (locale) => `/${locale}/dashboard/apply`,
        icon: Code,
        flag: "embed",
      },
    ],
  },
  {
    id: "desk",
    labelKey: "Sidebar.desk",
    items: [
      {
        titleKey: "Sidebar.settings",
        href: (locale) => `/${locale}/dashboard/settings`,
        icon: Settings,
      },
    ],
  },
];
