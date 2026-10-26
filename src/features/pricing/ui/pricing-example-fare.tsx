"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { splitDeposit } from "@/features/pricing/lib/deposit-charge";
import { PricingField, parseAmount } from "@/features/pricing/ui/pricing-field";

const money = (value: number) => `€${value.toFixed(2)}`;
const round = (value: number) => Math.round(value * 100) / 100;

/** Mirrors the surcharge order in quote-fare.ts (meet & greet, night, holiday, minimum, deposit). */
export function PricingExampleFare({
  nightPercent,
  holidayPercent,
  meetGreetPrice,
  minimumFare,
  depositPercent,
}: {
  nightPercent: number;
  holidayPercent: number;
  meetGreetPrice: number;
  minimumFare: number;
  depositPercent: number;
}) {
  const t = useTranslations("Pricing");
  const [base, setBase] = useState("50");
  const [night, setNight] = useState(true);
  const [holiday, setHoliday] = useState(false);
  const [meet, setMeet] = useState(false);

  const baseFare = Math.max(0, parseAmount(base) ?? 0);
  const meetAmount = meet ? round(meetGreetPrice) : 0;
  const surchargeBase = baseFare + meetAmount;
  const nightAmount = night ? round((surchargeBase * nightPercent) / 100) : 0;
  const holidayAmount = holiday ? round((surchargeBase * holidayPercent) / 100) : 0;
  const before = surchargeBase + nightAmount + holidayAmount;
  const minimumAmount = minimumFare > before ? round(minimumFare - before) : 0;
  const total = round(before + minimumAmount);
  const split = splitDeposit(total, depositPercent);

  const lines = [
    { label: t("example-base"), amount: baseFare },
    { label: t("meet"), amount: meetAmount },
    { label: t("example-night", { percent: nightPercent }), amount: nightAmount },
    { label: t("example-holiday", { percent: holidayPercent }), amount: holidayAmount },
    { label: t("example-minimum"), amount: minimumAmount },
  ].filter((line, index) => index === 0 || line.amount !== 0);

  const checks: [string, boolean, (value: boolean) => void][] = [
    [t("example-at-night"), night, setNight],
    [t("example-on-holiday"), holiday, setHoliday],
    [t("meet"), meet, setMeet],
  ];

  return (
    <section aria-labelledby="example-fare-title" className="desk-card flex flex-col gap-4 rounded-md border border-border bg-card p-4">
      <div>
        <h2 id="example-fare-title" className="font-semibold">{t("example-title")}</h2>
        <p className="text-sm text-muted-foreground">{t("example-help")}</p>
      </div>
      <PricingField label={t("example-base")} unit="€" inputMode="decimal" value={base} onChange={setBase} />
      <div className="flex flex-col">
        {checks.map(([label, checked, set]) => (
          <label key={label} className="flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" className="size-5 accent-primary" checked={checked} onChange={(event) => set(event.target.checked)} />
            {label}
          </label>
        ))}
      </div>
      <dl className="flex flex-col gap-1 text-sm" aria-live="polite">
        {lines.map((line) => (
          <div key={line.label} className="flex justify-between gap-2">
            <dt className="text-muted-foreground">{line.label}</dt>
            <dd className="tabular-nums">{money(line.amount)}</dd>
          </div>
        ))}
        <div className="mt-1 flex justify-between gap-2 border-t border-border pt-2 font-semibold">
          <dt>{t("example-total")}</dt>
          <dd className="tabular-nums">{money(total)}</dd>
        </div>
        {split.depositDue > 0 ? (
          <>
            <div className="flex justify-between gap-2">
              <dt>{t("example-now", { percent: split.depositPercent })}</dt>
              <dd className="tabular-nums">{money(split.depositDue)}</dd>
            </div>
            <div className="flex justify-between gap-2 text-muted-foreground">
              <dt>{t("example-later")}</dt>
              <dd className="tabular-nums">{money(split.balanceDue)}</dd>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">{t("example-full")}</p>
        )}
      </dl>
    </section>
  );
}
