import {
  Blocks,
  CalendarDays,
  Car,
  Code,
  Contact,
  Handshake,
  IdCard,
  LayoutDashboard,
  Megaphone,
  Route,
  ScrollText,
  Send,
  Settings,
  SlidersHorizontal,
  Sun,
  Tag,
  type LucideIcon,
} from "lucide-react";

export type DeskNavFlag = "drivers" | "partners" | "formBuilder" | "embed" | "marketing";

export type DeskNavItem = {
  titleKey: string;
  href: (locale: string) => string;
  icon: LucideIcon;
  flag?: DeskNavFlag;
  showWhen?: "approved";
  /** Also active on child routes (e.g. /campaigns/new, /campaigns/[id]). */
  matchNested?: boolean;
};

export type DeskNavGroup = {
  id: string;
  labelKey: string;
  items: DeskNavItem[];
};

export const deskNavGroups: DeskNavGroup[] = [
  {
    id: "overview",
    labelKey: "Sidebar.overview",
    items: [
      { titleKey: "Sidebar.dashboard", href: (locale) => `/${locale}/dashboard/home`, icon: LayoutDashboard, },
      { titleKey: "Today.title", href: (locale) => `/${locale}/dashboard/today`, icon: Sun, },
      { titleKey: "Calendar.title", href: (locale) => `/${locale}/dashboard/calendar`, icon: CalendarDays, },
    ],
  },
  {
    id: "operations",
    labelKey: "Sidebar.operations",
    items: [
      { titleKey: "Sidebar.rides", href: (locale) => `/${locale}/dashboard/rides`, icon: Route, matchNested: true, },
      { titleKey: "Sidebar.fleet", href: (locale) => `/${locale}/dashboard/fleet`, icon: Car, matchNested: true, },
      { titleKey: "Sidebar.drivers", href: (locale) => `/${locale}/dashboard/drivers`, icon: IdCard, flag: "drivers", matchNested: true, },
      { titleKey: "Sidebar.partners", href: (locale) => `/${locale}/dashboard/partners`, icon: Handshake, flag: "partners", matchNested: true, },
    ],
  },
  {
    id: "customers",
    labelKey: "Sidebar.customers",
    items: [
      { titleKey: "Sidebar.customer_list", href: (locale) => `/${locale}/dashboard/customers`, icon: Contact, matchNested: true, },
      { titleKey: "Sidebar.customer_audit", href: (locale) => `/${locale}/dashboard/customers/audit`, icon: ScrollText, },
    ],
  },
  {
    id: "marketing",
    labelKey: "Sidebar.marketing",
    items: [
      { titleKey: "Sidebar.marketing_overview", href: (locale) => `/${locale}/dashboard/marketing`, icon: Megaphone, flag: "marketing", },
      { titleKey: "Sidebar.campaigns", href: (locale) => `/${locale}/dashboard/marketing/campaigns`, icon: Send, matchNested: true, flag: "marketing", },
      { titleKey: "Sidebar.marketing_settings", href: (locale) => `/${locale}/dashboard/settings/marketing`, icon: SlidersHorizontal, flag: "marketing", },
    ],
  },
  {
    id: "booking_site",
    labelKey: "Sidebar.booking_site",
    items: [
      { titleKey: "Sidebar.form_builder", href: (locale) => `/${locale}/dashboard/form-builder`, icon: Blocks, flag: "formBuilder", },
      { titleKey: "Sidebar.embed_forms", href: (locale) => `/${locale}/dashboard/apply`, icon: Code, flag: "embed", },
      { titleKey: "Sidebar.pricing", href: (locale) => `/${locale}/dashboard/pricing`, icon: Tag, },
    ],
  },
  {
    id: "system",
    labelKey: "Sidebar.system",
    items: [
      { titleKey: "Sidebar.settings", href: (locale) => `/${locale}/dashboard/settings`, icon: Settings, matchNested: true, },
    ],
  },
];

export function isDeskNavItemActive(
  pathname: string,
  href: string,
  matchNested = false,
): boolean {
  if (pathname === href) return true;
  return matchNested && pathname.startsWith(`${href}/`);
}

/**
 * The single nav entry that owns `pathname`: the longest href that matches it
 * exactly, or as a parent when the entry opts into nested matching. This keeps
 * one highlight per page (e.g. /settings/marketing lights "Marketing settings",
 * not "Settings"; /customers/audit lights "Audit log", not "Customers").
 */
export function activeDeskNavHref(
  pathname: string,
  hrefs: { href: string; matchNested?: boolean }[],
): string | null {
  let best: string | null = null;
  for (const { href, matchNested } of hrefs) {
    if (!isDeskNavItemActive(pathname, href, matchNested)) continue;
    if (!best || href.length > best.length) best = href;
  }
  return best;
}
