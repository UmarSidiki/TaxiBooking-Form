"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

import { deskHeaderTitleKey } from "@/features/dashboard/lib/desk-header-title";
import { useDeskPageChrome } from "@/features/dashboard/ui/desk-page-chrome";
import { LanguageSwitcher } from "@/shared/ui/riviera/language-switcher";
import { RivieraThemeToggle } from "@/shared/ui/riviera/theme-toggle";
import { Separator } from "@/shared/ui/separator";
import { SidebarTrigger } from "@/shared/ui/sidebar";
import { BrandLogo, useBrandIdentity } from "@/features/settings/ui/brand-logo";

export function DeskChromeHeader() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const { meta } = useDeskPageChrome();
  const fallbackTitle = t(deskHeaderTitleKey(pathname, locale));
  const title = meta.title ?? fallbackTitle;
  const description = meta.description;
  const brand = useBrandIdentity(t("Auth.Desk.fallback_name"));

  return (
    <header className="flex min-h-(--header-height) shrink-0 items-center gap-2 border-b py-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:min-h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ms-1 min-h-11 min-w-11" />
        {/* The sidebar (and its brand plate) is off-canvas on phones, so the brand rides in the header. */}
        <span className="grid h-8 max-w-24 shrink-0 place-items-center overflow-hidden md:hidden" title={brand.name}>
          <BrandLogo
            brand={brand}
            imgProps={{ className: "h-7 w-auto max-w-full object-contain" }}
            initialClassName="grid size-7 place-items-center rounded-[var(--radius-sm)] bg-[var(--sig)] text-xs font-semibold text-[var(--sig-on)]"
          />
        </span>
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-medium text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="truncate text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <div className="ms-auto flex shrink-0 items-center gap-2">
          <LanguageSwitcher />
          <RivieraThemeToggle />
        </div>
      </div>
    </header>
  );
}
