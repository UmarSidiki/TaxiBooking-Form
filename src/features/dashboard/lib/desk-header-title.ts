import {
  deskNavGroups,
  type DeskNavGroup,
} from "@/features/dashboard/lib/sidebar-nav";
import { driverNavGroups } from "@/features/drivers/lib/driver-nav";
import { partnerNavGroups } from "@/features/partners/lib/partner-nav";
import {
  isSettingsDeskPath,
  settingsDeskNavGroups,
} from "@/features/settings/lib/settings-desk-nav";

const allNavGroups: DeskNavGroup[] = [
  ...deskNavGroups,
  ...driverNavGroups,
  ...partnerNavGroups,
];

function settingsTitleKey(pathname: string): string | null {
  if (!isSettingsDeskPath(pathname)) return null;
  const slug = pathname.split("/").pop() ?? "";
  for (const group of settingsDeskNavGroups) {
    const item = group.items.find((entry) => entry.href === slug);
    if (item) return item.titleKey;
  }
  return "Sidebar.settings";
}

/** Fallback title when a page does not publish DeskPageMeta. */
export function deskHeaderTitleKey(
  pathname: string,
  locale: string,
  groups: DeskNavGroup[] = allNavGroups
): string {
  const settingsKey = settingsTitleKey(pathname);
  if (settingsKey) return settingsKey;

  let bestKey = "Sidebar.dashboard";
  let bestLength = -1;

  for (const group of groups) {
    for (const item of group.items) {
      const href = item.href(locale);
      if (pathname === href) return item.titleKey;
      if (pathname.startsWith(`${href}/`) && href.length > bestLength) {
        bestKey = item.titleKey;
        bestLength = href.length;
      }
    }
  }

  return bestKey;
}
