"use client";

import { useTranslations } from "next-intl";
import type {
  AccountRides,
  AccountT,
  CancelPolicyTier,
  CustomerProfile,
} from "./account-types";
import { AccountTopBar } from "./account-top-bar";
import { AccountSideNav, AccountBottomTabs } from "./account-nav";
import { AccountOverview } from "./account-overview";
import { AccountRidesPage } from "./account-rides-page";
import { AccountProfile } from "./account-profile";
import { AccountNotifications } from "./account-notifications";
import { AccountSecurity } from "./account-security";
import { AccountRideDialogs } from "./account-ride-dialogs";
import { AccountFooter } from "./account-footer";
import { displayName } from "./account-format";
import { useAccountRideActions } from "../hooks/use-account-ride-actions";
import type { GreetingKey } from "../lib/account-greeting";
import type { AccountSection } from "../lib/account-sections";

export function AccountHome({
  section = "overview",
  email,
  profile,
  greeting,
  rides,
  locale,
  currency,
  companyPhone,
  cancelPolicy,
  marketingEnabled = true,
  brandName,
  logoUrl,
  onRefresh,
  onProfileSaved,
  onLogout,
  onSignOutEverywhere,
}: {
  section?: AccountSection;
  email: string;
  profile: CustomerProfile | null;
  greeting: GreetingKey;
  rides: AccountRides;
  locale: string;
  currency: string;
  companyPhone: string;
  cancelPolicy: CancelPolicyTier[] | null;
  marketingEnabled?: boolean;
  brandName: string;
  logoUrl: string;
  onRefresh: () => Promise<boolean>;
  onProfileSaved: (profile: CustomerProfile) => void;
  onLogout: () => void;
  onSignOutEverywhere: () => void;
}) {
  const t = useTranslations("Account") as unknown as AccountT;
  const actions = useAccountRideActions({ t, onRefresh });
  const name = displayName(profile?.name, email);
  const rideProps = {
    t,
    rides,
    locale,
    currency,
    cancelPolicy,
    onChange: actions.openChange,
    onCancel: actions.openCancel,
  };

  return (
    <div className="riviera min-h-svh bg-[var(--paper)] text-[var(--ink)]">
      <AccountTopBar
        t={t}
        locale={locale}
        brandName={brandName}
        logoUrl={logoUrl}
        name={name}
        email={email}
        onLogout={onLogout}
        onSignOutEverywhere={onSignOutEverywhere}
      />

      <div
        id="top"
        className="mx-auto grid w-full max-w-[1180px] gap-6 px-4 pb-28 pt-5 md:grid-cols-[200px_minmax(0,1fr)] md:px-5 md:pb-14 md:pt-[30px] lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-8"
      >
        <AccountSideNav t={t} locale={locale} section={section} />

        <main className="min-w-0" data-account-section={section}>
          {actions.notice ? (
            <p role="status" className="mb-3 text-xs text-[var(--ink2)]">
              {actions.notice}
            </p>
          ) : null}

          {section === "overview" ? (
            <AccountOverview
              {...rideProps}
              name={name}
              greeting={greeting}
              profile={profile}
              companyPhone={companyPhone}
              marketingEnabled={marketingEnabled}
            />
          ) : null}
          {section === "rides" ? <AccountRidesPage {...rideProps} /> : null}
          {section === "profile" ? (
            <AccountProfile
              t={t}
              email={email}
              locale={locale}
              profile={profile}
              onSaved={onProfileSaved}
            />
          ) : null}
          {section === "notifications" ? (
            <AccountNotifications
              t={t}
              locale={locale}
              profile={profile}
              marketingEnabled={marketingEnabled}
              onSaved={onProfileSaved}
            />
          ) : null}
          {section === "security" ? (
            <AccountSecurity
              t={t}
              email={email}
              locale={locale}
              profile={profile}
              onLogout={onLogout}
              onSignOutEverywhere={onSignOutEverywhere}
            />
          ) : null}

          <AccountFooter t={t} brandName={brandName} />
        </main>
      </div>

      <AccountBottomTabs t={t} locale={locale} section={section} />

      <AccountRideDialogs t={t} locale={locale} actions={actions} />
    </div>
  );
}
