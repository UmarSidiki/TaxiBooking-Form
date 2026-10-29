import type { IVehicle } from "@/features/fleet/model";
import { connectDB } from "@/shared/db";
import { Setting } from "@/features/settings/model";
import PricingRule from "@/features/pricing/model/PricingRule";
import { activeHolidays, normalizeHolidays } from "@/features/pricing/lib/holidays";
import { readExtras } from "@/features/pricing/lib/load-pricing-extras";
import { loadPromo, redeemPromo, type PromoFailure } from "@/features/pricing/lib/redeem-promo";
import {
  disabledExtrasRequested,
  quoteFare,
  type FareQuote,
  type QuoteInput,
} from "@/features/pricing/lib/quote-fare";
import type { TaxSettings } from "@/features/payments/lib/fare/calculate-booking-price";

export type PriceFailure = PromoFailure | "extra_disabled";

export async function priceServerBooking(input: {
  vehicle: IVehicle;
  booking: QuoteInput & { promoCode?: string; email?: string };
  distanceKm?: number;
  tax: TaxSettings;
  redeem?: boolean;
  now?: Date;
}): Promise<{ ok: true; quote: FareQuote } | { ok: false; error: PriceFailure }> {
  await connectDB();
  const customerKey = input.booking.email?.trim().toLowerCase() ?? "";
  const [rule, setting, promo] = await Promise.all([
    PricingRule.findOne().lean<Record<string, never>>() as Promise<Record<string, unknown> | null>,
    Setting.findOne({}, { timezone: 1, promoCodesEnabled: 1 }).lean<{
      timezone?: string;
      promoCodesEnabled?: boolean;
    }>(),
    loadPromo(input.booking.promoCode, customerKey),
  ]);
  if (input.booking.promoCode?.trim() && setting?.promoCodesEnabled === false) {
    return { ok: false, error: "promo_invalid" };
  }
  if (!promo.ok) return promo;
  const extras = readExtras(rule?.extras as never);
  if (disabledExtrasRequested(input.booking, extras).length > 0) return { ok: false, error: "extra_disabled" };

  const holidays = activeHolidays(
    normalizeHolidays(rule?.holidays as never),
    input.now ?? new Date(),
    setting?.timezone,
  );
  const quote = quoteFare(
    input.vehicle,
    input.booking,
    input.tax,
    input.distanceKm,
    {
      night: rule
        ? { start: String(rule.nightStart), end: String(rule.nightEnd), percent: Number(rule.nightPercent) || 0 }
        : undefined,
      holidays,
      extras,
      depositPercent: Number(rule?.depositPercent) || 0,
    },
    promo.promo,
  );
  if (input.redeem && promo.promo && quote.promoCode) {
    const redeemed = await redeemPromo(promo.promo.id, customerKey);
    if (!redeemed.ok) return redeemed;
  }
  return { ok: true, quote };
}
