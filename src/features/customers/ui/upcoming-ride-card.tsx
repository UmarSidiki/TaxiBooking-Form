import { Plus } from "lucide-react";
import type { AccountT, CancelPolicyTier, Ride } from "./account-types";
import { AccountButton, AccountLink } from "./account-buttons";
import { AccountRouteRail } from "./account-route-rail";
import { UpcomingRideFacts } from "./upcoming-ride-facts";
import { freeCancellationWallTime } from "../lib/free-cancellation";
import {
  formatDeadline,
  formatRideDay,
  formatRideTime,
  routeLabel,
  statusLabel,
  statusTone,
} from "./account-ride-format";

export function UpcomingRideCard({
  ride,
  t,
  locale,
  currency,
  cancelPolicy,
  onChange,
  onCancel,
}: {
  ride: Ride | null;
  t: AccountT;
  locale: string;
  currency: string;
  cancelPolicy?: CancelPolicyTier[] | null;
  onChange: (ride: Ride) => void;
  onCancel: (ride: Ride) => void;
}) {
  if (!ride) return <EmptyUpcoming t={t} locale={locale} />;

  const canModify =
    ["requested", "awaiting_payment", "upcoming"].includes(ride.status ?? "") &&
    ride.date >= new Date().toISOString().slice(0, 10);
  const route = routeLabel(t, ride.pickup, ride.dropoff);
  const deadline = freeCancellationWallTime(ride.date, ride.time, cancelPolicy);

  return (
    <article
      aria-labelledby="next-ride"
      className="rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--sheet)] p-[18px] md:p-[22px]"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[var(--ink2)]">
          {t("upcoming-ride")}
        </p>
        <span className="status-mark" data-tone={statusTone(ride.status)}>
          <span className="status-mark__dot" aria-hidden="true" />
          {statusLabel(t, ride.status)}
        </span>
      </div>

      <h2
        id="next-ride"
        className="mt-[7px] text-[21px] font-semibold leading-[1.2] tracking-[-0.025em] tabular-nums md:text-[23px]"
      >
        <span className="min-[380px]:hidden">{formatRideDay(ride, locale, "short")}</span>
        <span className="hidden min-[380px]:inline">{formatRideDay(ride, locale)}</span>
        <span> · {formatRideTime(ride, locale)}</span>
      </h2>
      <p className="m-0 text-xs text-[var(--ink2)] md:text-[12.5px]">
        {t("trip-meta", { id: ride.tripId, route })}
      </p>

      <AccountRouteRail
        pickup={ride.pickup}
        dropoff={ride.dropoff}
        pickupLabel={t("pickup")}
        dropoffLabel={t("dropoff")}
        pickupTime={formatRideTime(ride, locale)}
      />

      <UpcomingRideFacts ride={ride} t={t} locale={locale} currency={currency} />

      <div className="mt-[18px] grid grid-cols-3 gap-2 border-t border-[var(--rule)] pt-4 md:flex md:items-center">
        {canModify ? (
          <>
            <AccountButton
              type="button"
              className="w-full px-1.5 md:w-auto md:px-3.5"
              onClick={() => onChange(ride)}
            >
              {t("change")}
            </AccountButton>
            <AccountButton
              type="button"
              className="w-full px-1.5 md:w-auto md:px-3.5"
              onClick={() => onCancel(ride)}
            >
              {t("cancel")}
            </AccountButton>
          </>
        ) : null}
        <AccountLink
          href={`/api/invoice/${ride.tripId}`}
          variant="ghost"
          className="w-full px-1.5 md:w-auto md:px-3.5"
        >
          {t("receipt")}
        </AccountLink>
        {deadline ? (
          <span className="col-span-3 text-[11px] text-[var(--ink2)] md:col-span-1 md:ms-auto">
            {t("free-cancellation-until", {
              date: formatDeadline(deadline, locale),
            })}
          </span>
        ) : null}
      </div>
    </article>
  );
}

function EmptyUpcoming({ t, locale }: { t: AccountT; locale: string }) {
  return (
    <article
      aria-labelledby="next-ride"
      className="rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--sheet)] p-[18px] md:p-[22px]"
    >
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[var(--ink2)]">
        {t("upcoming-ride")}
      </p>
      <h2
        id="next-ride"
        className="mt-2 text-[19px] font-semibold leading-[1.2] tracking-[-0.02em] md:text-[21px]"
      >
        {t("no-upcoming-title")}
      </h2>
      <p className="mb-4 mt-1.5 text-xs leading-[1.55] text-[var(--ink2)]">
        {t("no-upcoming-copy")}
      </p>
      <AccountLink href={`/${locale}`} variant="primary" className="w-full sm:w-auto">
        <Plus className="size-4" aria-hidden="true" />
        {t("book-a-ride")}
      </AccountLink>
    </article>
  );
}
