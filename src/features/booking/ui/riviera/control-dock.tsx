"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { CircleUserRound } from "lucide-react";
import { LanguageSwitcher } from "@/shared/ui/riviera/language-switcher";
import { RivieraThemeToggle } from "@/shared/ui/riviera/theme-toggle";

/**
 * Floating control bar that replaces the page header.
 * Placement lives in riviera.css (.dock): bottom of the map panel on desktop step 1,
 * bottom of the viewport on mobile and on steps without a map.
 */
export function ControlDock({ brand }: { brand: string }) {
  const t = useTranslations("Riviera");
  const locale = useLocale();
  return (
    <nav className="dock" aria-label={t("siteControls")}>
      <span className="dock-brand" title={brand} aria-label={brand}>
        {brand.trim().charAt(0).toUpperCase()}
      </span>
      <span className="dock-sep" aria-hidden="true" />
      <LanguageSwitcher menuSide="top" />
      <RivieraThemeToggle />
      <Link href={`/${locale}/account`} className="dock-btn" aria-label={t("account")}>
        <CircleUserRound aria-hidden="true" />
      </Link>
    </nav>
  );
}
