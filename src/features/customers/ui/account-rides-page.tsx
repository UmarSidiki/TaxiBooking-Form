import type {
  AccountRides,
  AccountT,
  CancelPolicyTier,
  Ride,
} from "./account-types";
import { AccountPageHeader } from "./account-page-header";
import { AccountLink } from "./account-buttons";
import { UpcomingRideCard } from "./upcoming-ride-card";
import { AccountPastRides } from "./account-past-rides";
import { mergePastRides, nextUpcomingRide } from "../lib/next-ride";
import { Plus } from "lucide-react";

export function AccountRidesPage({
  t,
  rides,
  locale,
  currency,
  cancelPolicy,
  onChange,
  onCancel,
}: {
  t: AccountT;
  rides: AccountRides;
  locale: string;
  currency: string;
  cancelPolicy: CancelPolicyTier[] | null;
  onChange: (ride: Ride) => void;
  onCancel: (ride: Ride) => void;
}) {
  const first = nextUpcomingRide(rides.upcoming);
  const upcoming = first
    ? [first, ...rides.upcoming.filter((ride) => ride.tripId !== first.tripId)]
    : [];
  const past = mergePastRides(rides.past, rides.canceled);

  return (
    <>
      <AccountPageHeader
        title={t("rides-title")}
        subtitle={t("rides-subtitle")}
        actions={
          <AccountLink href={`/${locale}`} size="sm" className="px-2.5">
            <Plus className="size-3.5" aria-hidden="true" />
            <span>{t("book-a-ride")}</span>
          </AccountLink>
        }
      />
      <section aria-labelledby="rides-upcoming-title" className="mb-5">
        <h2
          id="rides-upcoming-title"
          className="mb-2.5 mt-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--ink2)]"
        >
          {t("upcoming")} · {upcoming.length}
        </h2>
        <div className="grid gap-3">
          {upcoming.length === 0 ? (
            <UpcomingRideCard
              ride={null}
              t={t}
              locale={locale}
              currency={currency}
              cancelPolicy={cancelPolicy}
              onChange={onChange}
              onCancel={onCancel}
            />
          ) : (
            upcoming.map((ride) => (
              <UpcomingRideCard
                key={ride.tripId}
                ride={ride}
                t={t}
                locale={locale}
                currency={currency}
                cancelPolicy={cancelPolicy}
                onChange={onChange}
                onCancel={onCancel}
              />
            ))
          )}
        </div>
      </section>
      <AccountPastRides rides={past} t={t} locale={locale} currency={currency} showAll />
    </>
  );
}
