"use client";

import { useTranslations } from "next-intl";
import type {
  AccountRides,
  AccountT,
  CancelPolicyTier,
  CustomerProfile,
  Ride,
} from "./account-types";
import { AccountTopBar } from "./account-top-bar";
import { AccountGreetingHeader } from "./account-greeting-header";
import { UpcomingRideCard } from "./upcoming-ride-card";
import { AccountQuickActions } from "./account-quick-actions";
import { AccountConcierge } from "./account-concierge";
import { AccountPastRides } from "./account-past-rides";
import { AccountBottomTabs } from "./account-bottom-tabs";
import { AccountSettingsSections } from "./account-settings-sections";
import { AccountRideDialogs } from "./account-ride-dialogs";
import { AccountFooter } from "./account-footer";
import { displayName, savedPlaceCount } from "./account-format";
import { mergePastRides, nextUpcomingRide } from "../lib/next-ride";
import { rebookHref as buildRebookHref } from "../lib/rebook-href";
import { useAccountRideActions } from "../hooks/use-account-ride-actions";
import type { GreetingKey } from "../lib/account-greeting";

export function AccountHome({
  email,
  profile,
  greeting,
  rides,
  locale,
  currency,
  companyPhone,
  cancelPolicy,
  brandName,
  logoUrl,
  onRefresh,
  onProfileSaved,
  onLogout,
  onSignOutEverywhere,
}: {
  email: string;
  profile: CustomerProfile | null;
  greeting: GreetingKey;
  rides: AccountRides;
  locale: string;
  currency: string;
  companyPhone: string;
  cancelPolicy: CancelPolicyTier[] | null;
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
  const nextRide = nextUpcomingRide(rides.upcoming);
  const pastRides = mergePastRides(rides.past, rides.canceled);
  const lastRide: Ride | null = pastRides[0] ?? null;

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

      <main
        id="top"
        className="mx-auto w-full max-w-[1120px] px-4 pb-28 pt-5 md:px-5 md:pb-14 md:pt-[30px]"
      >
        <AccountGreetingHeader
          t={t}
          name={name}
          greeting={greeting}
          locale={locale}
        />

        {actions.notice ? (
          <p role="status" className="mb-3 text-xs text-[var(--ink2)]">
            {actions.notice}
          </p>
        ) : null}

        <div className="grid gap-3 md:gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-5">
            <div className="min-w-0 lg:order-1">
              <UpcomingRideCard
                ride={nextRide}
                t={t}
                locale={locale}
                currency={currency}
                cancelPolicy={cancelPolicy}
                onChange={actions.openChange}
                onCancel={actions.openCancel}
              />
            </div>
            <div className="order-3 min-w-0 lg:order-2">
              <AccountPastRides
                rides={pastRides}
                t={t}
                locale={locale}
                currency={currency}
              />
            </div>
          </div>

          <aside className="order-2 grid gap-3 sm:grid-cols-2 lg:order-none lg:grid-cols-1">
            <AccountQuickActions
              t={t}
              rebookHref={
                lastRide ? buildRebookHref(lastRide, locale) : `/${locale}`
              }
              hasLastRide={Boolean(lastRide)}
              savedPlaces={savedPlaceCount(profile)}
            />
            <AccountConcierge t={t} companyPhone={companyPhone} />
          </aside>
        </div>

        <AccountSettingsSections
          t={t}
          profile={profile}
          onProfileSaved={onProfileSaved}
          onSignOutEverywhere={onSignOutEverywhere}
        />

        <AccountFooter t={t} brandName={brandName} />
      </main>

      <AccountBottomTabs t={t} />

      <AccountRideDialogs t={t} locale={locale} actions={actions} />
    </div>
  );
}
