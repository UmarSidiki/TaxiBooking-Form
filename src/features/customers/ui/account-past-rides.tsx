"use client";

import { useState } from "react";
import Link from "next/link";
import type { AccountT, Ride } from "./account-types";
import { AccountLink } from "./account-buttons";
import {
  formatPastDay,
  formatRideTime,
  rideMoney,
  routeLabel,
  statusLabel,
  vehicleName,
} from "./account-ride-format";
import { formatMoney } from "./portal-money";
import { rebookHref } from "../lib/rebook-href";

const PREVIEW_COUNT = 3;

export function AccountPastRides({
  rides,
  t,
  locale,
  currency,
  showAll = false,
  viewAllHref,
}: {
  rides: Ride[];
  t: AccountT;
  locale: string;
  currency: string;
  /** Rides page: list every ride with no toggle. */
  showAll?: boolean;
  /** Overview: "View all" goes to the rides page instead of expanding. */
  viewAllHref?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = showAll || expanded ? rides : rides.slice(0, PREVIEW_COUNT);

  return (
    <section
      id="past"
      aria-labelledby="past-title"
      className="scroll-mt-24 overflow-hidden rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--sheet)]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--rule)] px-4 py-3.5 md:px-5 md:py-4">
        <h2 id="past-title" className="m-0 text-[13px] font-semibold">
          {t("past-rides")}
        </h2>
        {showAll ? null : viewAllHref && rides.length > 0 ? (
          <Link
            href={viewAllHref}
            className="inline-flex min-h-11 items-center px-1 text-xs text-[var(--link)] hover:underline hover:underline-offset-2"
          >
            {t("view-all")}
          </Link>
        ) : rides.length > PREVIEW_COUNT ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="inline-flex min-h-11 items-center px-1 text-xs text-[var(--link)] hover:underline hover:underline-offset-2"
          >
            {expanded ? t("show-less") : t("view-all")}
          </button>
        ) : null}
      </div>

      {rides.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm font-medium">{t("past-empty-title")}</p>
          <p className="mt-1 text-xs leading-[1.55] text-[var(--ink2)]">
            {t("past-empty-copy")}
          </p>
        </div>
      ) : (
        <ul className="m-0 list-none p-0">
          {visible.map((ride) => (
            <RideRow
              key={ride.tripId}
              ride={ride}
              t={t}
              locale={locale}
              currency={currency}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function RideRow({
  ride,
  t,
  locale,
  currency,
}: {
  ride: Ride;
  t: AccountT;
  locale: string;
  currency: string;
}) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 border-t border-[var(--rule)] px-4 py-3.5 first:border-t-0 md:grid-cols-[92px_minmax(0,1fr)_76px_auto] md:items-center md:gap-4 md:px-5">
      <div className="order-1 flex items-baseline gap-1.5 text-xs font-medium tabular-nums md:block">
        <span>{formatPastDay(ride, locale)}</span>
        <span className="text-[11.5px] font-normal text-[var(--ink2)] md:mt-px md:block">
          {formatRideTime(ride, locale)}
        </span>
      </div>

      <div className="order-3 col-span-2 min-w-0 md:order-2 md:col-span-1">
        <b className="block truncate text-[12.5px] font-medium">
          {routeLabel(t, ride.pickup, ride.dropoff)}
        </b>
        <span className="mt-0.5 block truncate text-[11px] text-[var(--ink2)]">
          {t("ride-meta", { vehicle: vehicleName(ride), id: ride.tripId })}
        </span>
        {ride.status === "canceled" ? (
          <span className="status-mark mt-1.5" data-tone="err">
            <span className="status-mark__dot" aria-hidden="true" />
            {statusLabel(t, ride.status)}
          </span>
        ) : null}
      </div>

      <div className="order-2 text-end text-[12.5px] font-medium tabular-nums md:order-3">
        {rideMoney(ride, locale, currency)}
        {ride.paymentStatus === "completed" &&
        ride.balanceDue &&
        ride.balanceDue > 0 ? (
          <span className="mt-0.5 block text-[11px] font-normal text-[var(--ink2)]">
            {t("balance-due")}:{" "}
            {formatMoney(ride.balanceDue, locale, currency)}
            {ride.payUrl ? (
              <Link
                href={ride.payUrl}
                className="ms-1 font-medium text-[var(--link)] underline-offset-2 hover:underline"
              >
                {t("pay-now")}
              </Link>
            ) : ride.paymentMethod === "cash" ? (
              <span className="ms-1">{t("cash-to-driver")}</span>
            ) : null}
          </span>
        ) : null}
      </div>

      <div className="order-4 col-span-2 flex items-center gap-3.5 md:order-4 md:col-span-1 md:justify-end md:gap-3">
        <AccountLink
          href={`/api/invoice/${ride.tripId}`}
          variant="link"
          className="h-11 px-0 text-[11.5px]"
        >
          {t("receipt")}
        </AccountLink>
        <AccountLink
          href={rebookHref(ride, locale)}
          size="compact"
          className="text-[11.5px]"
        >
          {t("rebook")}
        </AccountLink>
      </div>
    </li>
  );
}
