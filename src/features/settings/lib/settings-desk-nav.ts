export type SettingsDeskNavItem = {
  href: string;
  titleKey: string;
};

export type SettingsDeskNavGroup = {
  id: "daily" | "setup";
  labelKey: string;
  items: SettingsDeskNavItem[];
};

export const settingsDeskNavGroups: SettingsDeskNavGroup[] = [
  {
    id: "daily",
    labelKey: "Dashboard.Settings.group_daily",
    items: [
      { href: "checkout", titleKey: "Dashboard.Settings.nav_checkout" },
      { href: "modules", titleKey: "Dashboard.Settings.nav_modules" },
      { href: "email", titleKey: "Dashboard.Settings.nav_email" },
      { href: "whatsapp", titleKey: "Dashboard.Settings.nav_whatsapp" },
    ],
  },
  {
    id: "setup",
    labelKey: "Dashboard.Settings.group_setup",
    items: [
      { href: "appearance", titleKey: "Dashboard.Settings.nav_appearance" },
      { href: "map", titleKey: "Dashboard.Settings.nav_map" },
      { href: "gateways", titleKey: "Dashboard.Settings.nav_gateways" },
    ],
  },
];

export function settingsDeskPath(locale: string, slug: string) {
  return `/${locale}/dashboard/settings/${slug}`;
}

export function isSettingsDeskPath(pathname: string) {
  return pathname.includes("/dashboard/settings");
}
