import Link from "next/link";
import { Bell, Clock, Home, ShieldCheck, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AccountT } from "./account-types";
import {
  ACCOUNT_SECTIONS,
  accountHref,
  type AccountSection,
} from "../lib/account-sections";

const ICONS: Record<AccountSection, LucideIcon> = {
  overview: Home,
  rides: Clock,
  profile: UserRound,
  notifications: Bell,
  security: ShieldCheck,
};

const LABEL_KEYS: Record<AccountSection, string> = {
  overview: "nav-overview",
  rides: "nav-rides",
  profile: "profile",
  notifications: "nav-notifications",
  security: "security",
};

const SHORT_LABEL_KEYS: Record<AccountSection, string> = {
  overview: "nav-home",
  rides: "nav-rides",
  profile: "profile",
  notifications: "nav-alerts",
  security: "security",
};

const HINT_KEYS: Record<AccountSection, string> = {
  overview: "nav-overview-hint",
  rides: "nav-rides-hint",
  profile: "nav-profile-hint",
  notifications: "nav-notifications-hint",
  security: "nav-security-hint",
};

/** Desktop and tablet: sticky side navigation between account sub-pages. */
export function AccountSideNav({
  t,
  locale,
  section,
}: {
  t: AccountT;
  locale: string;
  section: AccountSection;
}) {
  return (
    <nav
      aria-label={t("nav-account")}
      className="sticky top-[88px] hidden self-start md:block"
    >
      <ul className="m-0 grid list-none gap-0.5 p-0">
        {ACCOUNT_SECTIONS.map((item) => {
          const Icon = ICONS[item];
          const active = item === section;
          return (
            <li key={item}>
              <Link
                href={accountHref(locale, item)}
                aria-current={active ? "page" : undefined}
                data-section={item}
                className={`group flex min-h-11 items-start gap-3 rounded-[var(--radius)] px-3 py-2.5 transition-colors duration-150 motion-reduce:transition-none ${
                  active
                    ? "bg-[var(--sheet)] text-[var(--ink)] shadow-[inset_0_0_0_1px_var(--rule)]"
                    : "text-[var(--ink2)] hover:bg-[var(--well)] hover:text-[var(--ink)]"
                }`}
              >
                <Icon
                  className={`mt-px size-[18px] shrink-0 ${active ? "text-[var(--ink)]" : ""}`}
                  strokeWidth={1.7}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <b className="block text-[13px] font-medium leading-[1.3]">
                    {t(LABEL_KEYS[item])}
                  </b>
                  <span className="mt-0.5 hidden text-[11px] leading-[1.35] text-[var(--ink2)] lg:block">
                    {t(HINT_KEYS[item])}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Phones: fixed bottom tab bar with all five sub-pages. */
export function AccountBottomTabs({
  t,
  locale,
  section,
}: {
  t: AccountT;
  locale: string;
  section: AccountSection;
}) {
  return (
    <nav
      aria-label={t("nav-account")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--rule)] bg-[var(--sheet)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="m-0 grid list-none grid-cols-5 p-0 px-1 pt-1">
        {ACCOUNT_SECTIONS.map((item) => {
          const Icon = ICONS[item];
          const active = item === section;
          return (
            <li key={item} className="min-w-0">
              <Link
                href={accountHref(locale, item)}
                aria-current={active ? "page" : undefined}
                data-section={item}
                className={`relative flex min-h-[52px] flex-col items-center justify-center gap-[3px] px-0.5 text-[10px] font-medium ${
                  active ? "text-[var(--ink)]" : "text-[var(--ink2)]"
                }`}
              >
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3 top-0 h-[2px] rounded-full bg-[var(--ink)]"
                  />
                ) : null}
                <Icon className="size-5" strokeWidth={active ? 2 : 1.7} aria-hidden="true" />
                <span className="block max-w-full truncate">{t(SHORT_LABEL_KEYS[item])}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
