"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

import { deskHeaderTitleKey } from "@/features/dashboard/lib/desk-header-title";
import { useDeskPageChrome } from "@/features/dashboard/ui/desk-page-chrome";
import { LanguageSwitcher } from "@/shared/chrome/language-switcher";
import { Separator } from "@/shared/ui/separator";
import { SidebarTrigger } from "@/shared/ui/sidebar";

export function DeskChromeHeader() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const { meta } = useDeskPageChrome();
  const fallbackTitle = t(deskHeaderTitleKey(pathname, locale));
  const title = meta.title ?? fallbackTitle;
  const description = meta.description;

  return (
    <header className="flex min-h-(--header-height) shrink-0 items-center gap-2 border-b py-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:min-h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ms-1 min-h-11 min-w-11" />
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
        </div>
      </div>
    </header>
  );
}
