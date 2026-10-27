"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { IVehicle } from "@/features/fleet/model";
import type { HolidayRange } from "@/features/pricing/lib/holidays";
import { quoteFare, type PricingExtras } from "@/features/pricing/lib/quote-fare";
import { PricingField, parseAmount } from "@/features/pricing/ui/pricing-field";

const money = (value: number) => `€${value.toFixed(2)}`;
const LINE_KEYS: Record<string, string> = {
  vehicle: "example-base",
  child_seats: "extra-childSeat",
  baby_seats: "extra-babySeat",
  meet_greet: "extra-meetGreet",
  night: "example-night",
  holiday: "example-holiday",
};

/** Runs the real `quoteFare` on a sample trip so the preview can never drift from checkout. */
export function PricingExampleFare({
  night,
  holidays,
  extras,
  depositPercent,
}: {
  night: { start: string; end: string; percent: number };
  holidays: HolidayRange[];
  extras: PricingExtras;
  depositPercent: number;
}) {
  const t = useTranslations("Pricing");
  const [base, setBase] = useState("50");
  const [atNight, setAtNight] = useState(true);
  const [onHoliday, setOnHoliday] = useState(false);
  const [meet, setMeet] = useState(false);
  const [childSeat, setChildSeat] = useState(false);

  const vehicle = { price: Math.max(0, parseAmount(base) ?? 0), pricePerKm: 0, minimumFare: 0, discount: 0, priceTiers: [] } as unknown as IVehicle;
  const quote = quoteFare(
    vehicle,
    {
      bookingType: "destination",
      tripType: "oneway",
      time: atNight ? night.start : "12:00",
      date: onHoliday ? holidays[0]?.start : undefined,
      meetAndGreet: meet,
      childSeats: childSeat ? 1 : 0,
    },
    {},
    undefined,
    { night, holidays, extras, depositPercent },
  );

  const checks: [string, boolean, (value: boolean) => void, boolean][] = [
    [t("example-at-night"), atNight, setAtNight, true],
    [t("example-on-holiday"), onHoliday, setOnHoliday, holidays.length > 0],
    [t("extra-meetGreet"), meet, setMeet, extras.meetGreet.enabled],
    [t("example-child-seat"), childSeat, setChildSeat, extras.childSeat.enabled],
  ];

  return (
    <section aria-labelledby="example-fare-title" className="desk-card flex flex-col gap-4 rounded-md border border-border bg-card p-4">
      <div>
        <h2 id="example-fare-title" className="font-semibold">{t("example-title")}</h2>
        <p className="text-sm text-muted-foreground">{t("example-help")}</p>
      </div>
      <PricingField label={t("example-base")} unit="€" inputMode="decimal" value={base} onChange={setBase} />
      <div className="flex flex-col">
        {checks
          .filter(([, , , shown]) => shown)
          .map(([label, checked, set]) => (
            <label key={label} className="flex min-h-11 items-center gap-3 text-sm">
              <input type="checkbox" className="size-5 accent-primary" checked={checked} onChange={(event) => set(event.target.checked)} />
              {label}
            </label>
          ))}
      </div>
      <dl className="flex flex-col gap-1 text-sm" aria-live="polite">
        {quote.lines
          .filter((line) => LINE_KEYS[line.code])
          .map((line) => (
            <div key={line.code} className="flex justify-between gap-2">
              <dt className="text-muted-foreground">{t(LINE_KEYS[line.code])}</dt>
              <dd className="tabular-nums">{money(line.amount)}</dd>
            </div>
          ))}
        <div className="mt-1 flex justify-between gap-2 border-t border-border pt-2 font-semibold">
          <dt>{t("example-total")}</dt>
          <dd className="tabular-nums">{money(quote.total)}</dd>
        </div>
        {quote.depositDue > 0 ? (
          <>
            <div className="flex justify-between gap-2">
              <dt>{t("example-now", { percent: quote.depositPercent })}</dt>
              <dd className="tabular-nums">{money(quote.depositDue)}</dd>
            </div>
            <div className="flex justify-between gap-2 text-muted-foreground">
              <dt>{t("example-later")}</dt>
              <dd className="tabular-nums">{money(quote.balanceDue)}</dd>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">{t("example-full")}</p>
        )}
      </dl>
    </section>
  );
}
