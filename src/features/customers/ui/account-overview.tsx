import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type {
  AccountRides,
  AccountT,
  CancelPolicyTier,
  CustomerProfile,
  Ride,
} from "./account-types";
import { AccountGreetingHeader } from "./account-greeting-header";
import { UpcomingRideCard } from "./upcoming-ride-card";
import { AccountQuickActions } from "./account-quick-actions";
import { AccountConcierge } from "./account-concierge";
import { AccountPastRides } from "./account-past-rides";
import { savedPlaceCount } from "./account-format";
import { mergePastRides, nextUpcomingRide } from "../lib/next-ride";
import { rebookHref as buildRebookHref } from "../lib/rebook-href";
import { accountHref } from "../lib/account-sections";
import type { GreetingKey } from "../lib/account-greeting";

export function AccountOverview({
  t,
  name,
  greeting,
  profile,
  rides,
  locale,
  currency,
  companyPhone,
  cancelPolicy,
  onChange,
  onCancel,
}: {
  t: AccountT;
  name: string;
  greeting: GreetingKey;
  profile: CustomerProfile | null;
  rides: AccountRides;
  locale: string;
  currency: string;
  companyPhone: string;
  cancelPolicy: CancelPolicyTier[] | null;
  onChange: (ride: Ride) => void;
  onCancel: (ride: Ride) => void;
}) {
  const nextRide = nextUpcomingRide(rides.upcoming);
  const pastRides = mergePastRides(rides.past, rides.canceled);
  const lastRide: Ride | null = pastRides[0] ?? null;
  const subscribed =
    profile?.marketing?.email?.status === "granted" ||
    profile?.marketing?.whatsapp?.status === "granted";

  return (
    <>
      <AccountGreetingHeader t={t} name={name} greeting={greeting} locale={locale} />

      <div className="grid gap-3 md:gap-5 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
        <div className="contents xl:flex xl:min-w-0 xl:flex-col xl:gap-5">
          <div className="min-w-0 xl:order-1">
            <UpcomingRideCard
              ride={nextRide}
              t={t}
              locale={locale}
              currency={currency}
              cancelPolicy={cancelPolicy}
              onChange={onChange}
              onCancel={onCancel}
            />
          </div>
          <div className="order-3 min-w-0 xl:order-2">
            <AccountPastRides
              rides={pastRides}
              t={t}
              locale={locale}
              currency={currency}
              viewAllHref={accountHref(locale, "rides")}
            />
          </div>
        </div>

        <aside className="order-2 grid gap-3 sm:grid-cols-2 xl:order-none xl:grid-cols-1">
          <AccountQuickActions
            t={t}
            locale={locale}
            rebookHref={lastRide ? buildRebookHref(lastRide, locale) : `/${locale}`}
            hasLastRide={Boolean(lastRide)}
            savedPlaces={savedPlaceCount(profile)}
          />
          {subscribed ? (
            <AccountConcierge t={t} companyPhone={companyPhone} />
          ) : (
            <Link
              href={accountHref(locale, "notifications", "offers")}
              className="group flex flex-col gap-2 rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--sheet)] p-4 text-[var(--ink)] transition-colors hover:border-[var(--rule2)] hover:bg-[var(--well)] md:p-[18px]"
            >
              <span className="inline-flex items-center gap-2 text-[13px] font-semibold">
                <Sparkles className="size-4 text-[var(--ink2)]" aria-hidden="true" />
                {t("offers-teaser-title")}
              </span>
              <span className="text-xs leading-[1.55] text-[var(--ink2)]">
                {t("offers-teaser-copy")}
              </span>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[var(--link)]">
                {t("offers-teaser-cta")}
                <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden="true" />
              </span>
            </Link>
          )}
        </aside>
      </div>
    </>
  );
}
