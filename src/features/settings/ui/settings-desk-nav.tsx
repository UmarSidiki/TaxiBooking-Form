"use client";

import { Link } from "@/shared/i18n/navigation";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

import { settingsDeskNavGroups } from "@/features/settings/lib/settings-desk-nav";
import { cn } from "@/shared/lib/utils";

export function SettingsDeskNav() {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("Dashboard.Settings.settings")}
      className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-2 lg:sticky lg:top-6 lg:mx-0 lg:w-52 lg:shrink-0 lg:flex-col lg:gap-6 lg:overflow-visible lg:px-0 lg:pb-0"
    >
      {settingsDeskNavGroups.map((group) => (
        <div key={group.id} className="contents lg:flex lg:flex-col lg:gap-1">
          <p className="sr-only px-3 text-xs font-medium text-muted-foreground lg:not-sr-only">
            {t(group.labelKey)}
          </p>
          {group.items.map((item) => {
            const href = `/dashboard/settings/${item.href}`;
            const active = pathname.endsWith(`/settings/${item.href}`);
            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-md px-3 text-sm font-medium outline-none transition-colors duration-200 focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                {t(item.titleKey)}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
