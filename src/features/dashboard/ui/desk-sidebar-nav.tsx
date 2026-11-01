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
  activeDeskNavHref,
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

  const visible = groups
    .map((group) => ({
      group,
      items: group.items.filter(
        (item) => isDeskNavFlagOn(item.flag, settings) && isVisible(item, approved)
      ),
    }))
    .filter((entry) => entry.items.length > 0);

  const activeHref = activeDeskNavHref(
    pathname,
    visible.flatMap(({ items }) =>
      items.map((item) => ({ href: item.href(locale), matchNested: item.matchNested }))
    )
  );

  return (
    <nav aria-label={t("Sidebar.navigation")} className="flex flex-col gap-0.5 py-1">
      {visible.map(({ group, items }) => (
        <DeskNavGroupBlock
          key={group.id}
          group={group}
          items={items}
          locale={locale}
          activeHref={activeHref}
          t={t}
        />
      ))}
    </nav>
  );
}

function isVisible(item: DeskNavItem, approved: boolean) {
  if (item.showWhen === "approved") return approved;
  return true;
}

function DeskNavGroupBlock({
  group,
  items,
  locale,
  activeHref,
  t,
}: {
  group: DeskNavGroup;
  items: DeskNavItem[];
  locale: string;
  activeHref: string | null;
  t: ReturnType<typeof useTranslations>;
}) {
  const labelId = `desk-nav-${group.id}`;

  return (
    <SidebarGroup className="py-1.5" data-nav-group={group.id}>
      <SidebarGroupLabel
        id={labelId}
        className="h-7 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-sidebar-foreground/55"
      >
        {t(group.labelKey)}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu aria-labelledby={labelId} className="gap-0.5">
          {items.map((item) => {
            const href = item.href(locale);
            const active = href === activeHref;
            return (
              <SidebarMenuItem key={item.titleKey}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={t(item.titleKey)}
                  className="relative min-h-10 data-[active=true]:font-semibold data-[active=true]:before:absolute data-[active=true]:before:inset-y-2 data-[active=true]:before:start-0 data-[active=true]:before:w-[3px] data-[active=true]:before:rounded-full data-[active=true]:before:bg-primary"
                >
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className="min-h-10 text-sidebar-foreground"
                  >
                    <item.icon aria-hidden="true" className={active ? "text-primary" : "opacity-80"} />
                    <span className="truncate text-sidebar-foreground">{t(item.titleKey)}</span>
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
