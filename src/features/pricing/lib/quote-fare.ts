import type { IVehicle } from "@/features/fleet/model";
import {
  calculateBookingPrice,
  type BookingPriceInput,
  type TaxSettings,
} from "@/features/payments/lib/fare/calculate-booking-price";
import { splitDeposit } from "@/features/pricing/lib/deposit-charge";

export type FareLine = { code: string; amount: number };

export type ZoneFare = { fromLabel: string; toLabel: string; price: number };

export type PromoFare = { code: string; kind: "percent" | "fixed"; amount: number };

export type OperatorFareRules = {
  zones?: ZoneFare[];
  night?: { start: string; end: string; percent: number };
  holidays?: { date: string; percent: number }[];
  meetGreetPrice?: number;
  operatorMinimumFare?: number;
  depositPercent?: number;
};

export type QuoteInput = BookingPriceInput & {
  date?: string;
  time?: string;
  meetAndGreet?: boolean;
};

export type FareQuote = {
  total: number;
  subtotal: number;
  taxAmount: number;
  taxPercentage: number;
  taxIncluded: boolean;
  lines: FareLine[];
  promoCode?: string;
  chargeAmount: number;
  depositDue: number;
  balanceDue: number;
  depositPercent: number;
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function matchZonePrice(pickup: string, dropoff: string, zones: ZoneFare[]) {
  const from = pickup.toLowerCase();
  const to = dropoff.toLowerCase();
  const hits = zones.filter(
    (zone) =>
      zone.fromLabel.trim().length >= 3 &&
      zone.toLabel.trim().length >= 3 &&
      from.includes(zone.fromLabel.trim().toLowerCase()) &&
      to.includes(zone.toLabel.trim().toLowerCase()),
  );
  hits.sort(
    (a, b) => b.fromLabel.length + b.toLabel.length - (a.fromLabel.length + a.toLabel.length),
  );
  return hits[0]?.price;
}

export function isNightTime(time: string, start: string, end: string) {
  const clock = time.slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(clock) || !/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
    return false;
  }
  if (start === end) return false;
  if (start < end) return clock >= start && clock < end;
  return clock >= start || clock < end;
}

function applyTax(amount: number, tax: TaxSettings) {
  const enableTax = tax.enableTax ?? false;
  const taxPercentage = tax.taxPercentage ?? 0;
  const taxIncluded = tax.taxIncluded ?? false;
  const taxAmount =
    enableTax && taxPercentage > 0
      ? taxIncluded
        ? amount - amount / (1 + taxPercentage / 100)
        : amount * (taxPercentage / 100)
      : 0;
  const total = taxIncluded ? amount : amount + taxAmount;
  const roundedTax = roundMoney(taxAmount);
  const roundedTotal = roundMoney(total);
  return {
    subtotal: roundMoney(roundedTotal - roundedTax),
    taxAmount: roundedTax,
    taxPercentage: enableTax ? taxPercentage : 0,
    taxIncluded,
    total: roundedTotal,
  };
}

function promoAmount(base: number, promo: PromoFare | null | undefined) {
  if (!promo || promo.amount <= 0 || base <= 0) return 0;
  if (promo.kind === "percent") return roundMoney((base * Math.min(promo.amount, 100)) / 100);
  return roundMoney(Math.min(promo.amount, base));
}

/**
 * Wraps `calculateBookingPrice`. Child seats, baby seats, stops, vehicle
 * minimum, tiers, and round-trip stay there. This adds zone prices, night and
 * holiday percents, meet & greet, an operator minimum, and a promo.
 */
export function quoteFare(
  vehicle: IVehicle,
  input: QuoteInput,
  tax: TaxSettings,
  distanceKm: number | undefined,
  rules: OperatorFareRules,
  promo?: PromoFare | null,
): FareQuote {
  const zonePrice =
    input.bookingType === "hourly" || !input.pickup || !input.dropoff
      ? undefined
      : matchZonePrice(input.pickup, input.dropoff, rules.zones ?? []);
  const source = "toObject" in vehicle && typeof vehicle.toObject === "function" ? vehicle.toObject() : vehicle;
  const pricedVehicle =
    zonePrice == null
      ? vehicle
      : ({
          ...source,
          price: zonePrice,
          pricePerKm: 0,
          priceTiers: [],
          minimumFare: 0,
        } as IVehicle);
  const base = calculateBookingPrice(pricedVehicle, input, tax, distanceKm);
  const anchor = tax.taxIncluded ? base.total : base.subtotal;
  const meet = input.meetAndGreet ? roundMoney(rules.meetGreetPrice ?? 0) : 0;
  const surchargeBase = anchor + meet;
  const night =
    input.time && rules.night && rules.night.percent > 0 && isNightTime(input.time, rules.night.start, rules.night.end)
      ? roundMoney((surchargeBase * rules.night.percent) / 100)
      : 0;
  const holidayPercent =
    rules.holidays?.find((holiday) => holiday.date === input.date)?.percent ?? 0;
  const holiday =
    holidayPercent > 0 ? roundMoney((surchargeBase * holidayPercent) / 100) : 0;
  const beforeMinimum = surchargeBase + night + holiday;
  const minimum =
    (rules.operatorMinimumFare ?? 0) > beforeMinimum
      ? roundMoney((rules.operatorMinimumFare ?? 0) - beforeMinimum)
      : 0;
  const beforePromo = beforeMinimum + minimum;
  const discount = promoAmount(beforePromo, promo);
  const taxed = applyTax(roundMoney(beforePromo - discount), tax);
  const lines: FareLine[] = [
    { code: "vehicle", amount: base.breakdown.discountedVehiclePrice },
    { code: "child_seats", amount: base.breakdown.childSeatsPrice },
    { code: "baby_seats", amount: base.breakdown.babySeatsPrice },
    { code: "stops", amount: base.breakdown.stopsTotalPrice },
    { code: "meet_greet", amount: meet },
    { code: "night", amount: night },
    { code: "holiday", amount: holiday },
    { code: "minimum", amount: minimum },
    { code: "promo", amount: discount === 0 ? 0 : -discount },
    { code: "tax", amount: taxed.taxAmount },
  ].filter((line) => line.amount !== 0 || line.code === "vehicle");

  return {
    ...taxed,
    lines,
    promoCode: discount > 0 ? promo?.code : undefined,
    ...splitDeposit(taxed.total, rules.depositPercent ?? 0),
  };
}
