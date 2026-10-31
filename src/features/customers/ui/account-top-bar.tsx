import type { ReactNode } from "react";
import type { AccountT } from "./account-types";
import { AccountBrandPlate } from "./account-login-brand";
import { AccountMenu } from "./account-menu";

export function AccountTopBar({
  t,
  locale,
  brandName,
  logoUrl,
  name,
  email,
  onLogout,
  onSignOutEverywhere,
}: {
  t: AccountT;
  locale: string;
  brandName: string;
  logoUrl: string;
  name: string;
  email: string;
  onLogout: () => void;
  onSignOutEverywhere: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--rule)] bg-[var(--sheet)]">
      <div className="mx-auto flex h-14 w-full max-w-[1120px] items-center gap-2 px-4 md:h-16 md:gap-[22px] md:px-5">
        <AccountBrandPlate
          name={brandName}
          tagline={t("brand-tagline")}
          logoUrl={logoUrl}
          className="min-w-0 max-w-[40vw] overflow-hidden md:max-w-none max-[379px]:[&_small]:hidden"
        />

        <nav
          aria-label={t("nav-account")}
          className="hidden h-full items-center gap-[22px] md:flex"
        >
          <TopLink href={`/${locale}/account`} active>
            {t("nav-home")}
          </TopLink>
          <TopLink href="#past">{t("nav-rides")}</TopLink>
          <TopLink href="#profile">{t("nav-account")}</TopLink>
        </nav>

        <div className="ms-auto flex min-w-0 items-center gap-2 md:gap-3">
          <div className="flex min-w-0 max-w-[33vw] flex-col items-end text-end leading-[1.3] md:max-w-none">
            <span className="text-[9.5px] text-[var(--ink2)] max-[379px]:hidden md:text-[10.5px]">
              {t("signed-in-as")}
            </span>
            <b
              className="max-w-full truncate text-[11px] font-medium text-[var(--ink2)] md:max-w-[220px] md:text-xs"
              title={email}
            >
              {email}
            </b>
          </div>
          <AccountMenu
            t={t}
            name={name}
            email={email}
            onLogout={onLogout}
            onSignOutEverywhere={onSignOutEverywhere}
          />
        </div>
      </div>
    </header>
  );
}

function TopLink({
  href,
  active = false,
  children,
}: {
  href: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative flex h-full items-center text-[12.5px] hover:text-[var(--ink)] ${
        active
          ? "text-[var(--ink)] after:absolute after:inset-x-0 after:-bottom-px after:h-[1.5px] after:bg-[var(--ink)]"
          : "text-[var(--ink2)]"
      }`}
    >
      {children}
    </a>
  );
}
