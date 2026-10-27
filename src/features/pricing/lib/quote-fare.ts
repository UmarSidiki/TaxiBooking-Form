import type { IVehicle } from "@/features/fleet/model";
import { DEFAULT_VEHICLE_RETURN_PRICE_PERCENTAGE } from "@/features/fleet/lib/vehicle-form-defaults";
import {
  calculateBookingPrice,
  type BookingPriceInput,
  type TaxSettings,
} from "@/features/payments/lib/fare/calculate-booking-price";
import { splitDeposit } from "@/features/pricing/lib/deposit-charge";
import { holidayPercentFor, type HolidayRange } from "@/features/pricing/lib/holidays";

export type FareLine = { code: string; amount: number };

export type PromoFare = { code: string; kind: "percent" | "fixed"; amount: number };

export type ExtraSetting = { enabled: boolean; price: number };
export type PricingExtras = { meetGreet: ExtraSetting; childSeat: ExtraSetting; babySeat: ExtraSetting };
export const EXTRA_KEYS = ["meetGreet", "childSeat", "babySeat"] as const;
export const defaultExtras = (): PricingExtras => ({
  meetGreet: { enabled: false, price: 0 },
  childSeat: { enabled: false, price: 0 },
  babySeat: { enabled: false, price: 0 },
});

export type OperatorFareRules = {
  night?: { start: string; end: string; percent: number };
  holidays?: HolidayRange[];
  extras?: PricingExtras;
  depositPercent?: number;
};

export type QuoteInput = BookingPriceInput & {
  date?: string;
  time?: string;
  returnDate?: string;
  returnTime?: string;
  meetAndGreet?: boolean;
};

/** Extras the request asks for that the operator has switched off. */
export function disabledExtrasRequested(input: QuoteInput, extras: PricingExtras) {
  const asked: string[] = [];
  if (input.meetAndGreet && !extras.meetGreet.enabled) asked.push("meetGreet");
  if ((Number(input.childSeats) || 0) > 0 && !extras.childSeat.enabled) asked.push("childSeat");
  if ((Number(input.babySeats) || 0) > 0 && !extras.babySeat.enabled) asked.push("babySeat");
  return asked;
}

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
 * Wraps `calculateBookingPrice`. Stops, vehicle minimum, tiers, and round-trip
 * stay there. This adds extras, night and holiday surcharges per
 * leg (a return leg uses its own date and time), a promo, and the deposit split.
 */
export function quoteFare(
  vehicle: IVehicle,
  input: QuoteInput,
  tax: TaxSettings,
  distanceKm: number | undefined,
  rules: OperatorFareRules,
  promo?: PromoFare | null,
): FareQuote {
  const extras = rules.extras ?? defaultExtras();
  const base = calculateBookingPrice(
    vehicle,
    {
      ...input,
      childSeatPrice: extras.childSeat.enabled ? extras.childSeat.price : 0,
      babySeatPrice: extras.babySeat.enabled ? extras.babySeat.price : 0,
    },
    tax,
    distanceKm,
  );
  const anchor = tax.taxIncluded ? base.total : base.subtotal;
  const meet = input.meetAndGreet && extras.meetGreet.enabled ? roundMoney(extras.meetGreet.price) : 0;

  const returnShare =
    input.bookingType !== "hourly" && input.tripType === "roundtrip"
      ? (vehicle.returnPricePercentage ?? DEFAULT_VEHICLE_RETURN_PRICE_PERCENTAGE) / 100
      : 0;
  const returnLeg = roundMoney((base.breakdown.discountedVehiclePrice * returnShare) / (1 + returnShare));
  const outboundLeg = anchor + meet - returnLeg;
  const legSurcharge = (amount: number, date?: string, time?: string) => {
    const nightPercent =
      time && rules.night && rules.night.percent > 0 && isNightTime(time, rules.night.start, rules.night.end)
        ? rules.night.percent
        : 0;
    const holidayPercent = holidayPercentFor(date, rules.holidays ?? []);
    return { night: (amount * nightPercent) / 100, holiday: (amount * holidayPercent) / 100 };
  };
  const out = legSurcharge(outboundLeg, input.date, input.time);
  const back = returnLeg > 0 ? legSurcharge(returnLeg, input.returnDate || input.date, input.returnTime || input.time) : { night: 0, holiday: 0 };
  const night = roundMoney(out.night + back.night);
  const holiday = roundMoney(out.holiday + back.holiday);

  const beforePromo = anchor + meet + night + holiday;
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
