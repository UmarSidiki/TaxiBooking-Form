"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/ui/sidebar";
import type { ISetting } from "@/features/settings/model";
import {
  deskNavGroups,
  type DeskNavGroup,
  type DeskNavItem,
} from "@/features/dashboard/lib/sidebar-nav";
import { isDeskNavFlagOn } from "@/features/dashboard/lib/is-desk-nav-flag-on";

export function DeskSidebarNav({
  locale,
  settings = {},
  groups = deskNavGroups,
  approved = true,
}: {
  locale: string;
  settings?: Partial<ISetting>;
  groups?: DeskNavGroup[];
  approved?: boolean;
}) {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <>
      {groups.map((group) => (
        <DeskNavGroupBlock
          key={group.id}
          group={group}
          locale={locale}
          pathname={pathname}
          settings={settings}
          approved={approved}
          t={t}
        />
      ))}
    </>
  );
}

function isVisible(item: DeskNavItem, approved: boolean) {
  if (item.showWhen === "approved") return approved;
  return true;
}

function DeskNavGroupBlock({
  group,
  locale,
  pathname,
  settings,
  approved,
  t,
}: {
  group: DeskNavGroup;
  locale: string;
  pathname: string;
  settings: Partial<ISetting>;
  approved: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const items = group.items.filter(
    (item) => isDeskNavFlagOn(item.flag, settings) && isVisible(item, approved)
  );
  if (items.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t(group.labelKey)}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const href = item.href(locale);
            return (
              <SidebarMenuItem key={item.titleKey}>
                <SidebarMenuButton asChild isActive={pathname === href} tooltip={t(item.titleKey)}>
                  <Link href={href} className="min-h-11">
                    <item.icon />
                    <span>{t(item.titleKey)}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
