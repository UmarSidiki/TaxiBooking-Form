import type { ReactNode } from "react";
import type { AccountT, Ride } from "./account-types";
import {
  driverName,
  paymentLine,
  rideMoney,
  vehicleDetail,
  vehicleName,
} from "./account-ride-format";

export function UpcomingRideFacts({
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
  const driver = driverName(t, ride);
  const assigned = Boolean(ride.assignedDriver?.name || ride.assignedPartner?.name);
  const detail = vehicleDetail(t, ride);
  const payment = paymentLine(t, ride);

  return (
    <dl className="mt-[18px] grid grid-cols-2 gap-x-3.5 gap-y-3.5 border-t border-[var(--rule)] pt-4 md:grid-cols-[1.15fr_1fr_0.85fr] md:gap-[18px]">
      <div className="col-span-2 md:col-span-1">
        <FactLabel>{t("vehicle")}</FactLabel>
        <dd className="m-0 text-[12.8px] font-medium leading-[1.4]">
          {vehicleName(ride)}
          {detail ? (
            <span className="mt-px block text-[11.5px] font-normal text-[var(--ink2)]">
              {detail}
            </span>
          ) : null}
        </dd>
      </div>
      <div>
        <FactLabel>{t("driver")}</FactLabel>
        <dd className="m-0 text-[12.8px] font-medium leading-[1.4]">
          <span className="flex items-center gap-[7px]">
            <span
              aria-hidden="true"
              className="grid size-[22px] shrink-0 place-items-center rounded-full border border-dashed border-[var(--rule2)] text-[10px] text-[var(--ink2)]"
            >
              {assigned ? driver.slice(0, 1).toUpperCase() : "—"}
            </span>
            {driver}
          </span>
          <span className="mt-px block text-[11.5px] font-normal text-[var(--ink2)]">
            {assigned ? t("driver-assigned-note") : t("to-be-assigned-note")}
          </span>
        </dd>
      </div>
      <div>
        <FactLabel>{t("fare")}</FactLabel>
        <dd className="m-0 text-[12.8px] font-medium leading-[1.4] tabular-nums">
          {rideMoney(ride, locale, currency)}
          {payment ? (
            <span className="mt-px block text-[11.5px] font-normal text-[var(--ink2)]">
              {payment}
            </span>
          ) : null}
        </dd>
      </div>
    </dl>
  );
}

function FactLabel({ children }: { children: ReactNode }) {
  return (
    <dt className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink2)]">
      {children}
    </dt>
  );
}
