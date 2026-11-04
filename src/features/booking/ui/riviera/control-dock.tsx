"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CircleUserRound } from "lucide-react";
import { LanguageSwitcher } from "@/shared/ui/riviera/language-switcher";
import { RivieraThemeToggle } from "@/shared/ui/riviera/theme-toggle";

/**
 * Floating control bar that replaces the page header.
 * Placement lives in riviera.css (.dock): bottom of the map panel on desktop,
 * bottom of the viewport everywhere else.
 */
export function ControlDock({ brand, logoUrl = "" }: { brand: string; logoUrl?: string }) {
  const t = useTranslations("Riviera");
  const locale = useLocale();
  const dockRef = useRef<HTMLElement>(null);
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null);
  const logo = logoUrl.trim();
  const showLogo = Boolean(logo) && failedLogoUrl !== logo;

  // The sheet reserves exactly as much room as the dock occupies, including
  // text zoom and the iOS safe area, so no control can hide behind it.
  useLayoutEffect(() => {
    const dock = dockRef.current;
    const host = dock?.closest<HTMLElement>(".riviera");
    if (!dock || !host) return;
    const write = () => {
      const height = Math.ceil(dock.getBoundingClientRect().height);
      host.style.setProperty(
        "--dock-reserve",
        `calc(${height}px + 20px + env(safe-area-inset-bottom))`
      );
    };
    write();
    const observer = new ResizeObserver(write);
    observer.observe(dock);
    return () => {
      observer.disconnect();
      host.style.removeProperty("--dock-reserve");
    };
  }, []);

  return (
    <nav className="dock" aria-label={t("siteControls")} ref={dockRef}>
      {showLogo ? (
        <span className="dock-logo" role="img" aria-label={brand} title={brand} data-testid="dock-logo">
          <img
            className="dock-logo__img"
            src={logo}
            alt=""
            onError={() => setFailedLogoUrl(logo)}
          />
        </span>
      ) : (
        <span className="dock-logo dock-logo--text" title={brand} data-testid="dock-logo">
          <span className="dock-logo__name" dir="auto">{brand}</span>
        </span>
      )}
      <span className="dock-sep" aria-hidden="true" />
      <div className="dock-controls">
        <LanguageSwitcher menuSide="top" />
        <RivieraThemeToggle />
        <Link
          href={`/${locale}/account`}
          className="dock-btn dock-account"
          aria-label={t("account")}
        >
          <CircleUserRound aria-hidden="true" />
          <span className="dock-account__label">{t("accountShort")}</span>
        </Link>
      </div>
    </nav>
  );
}
