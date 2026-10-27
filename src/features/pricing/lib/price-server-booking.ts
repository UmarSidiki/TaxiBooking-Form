import type { IVehicle } from "@/features/fleet/model";
import { connectDB } from "@/shared/db";
import { Setting } from "@/features/settings/model";
import FixedRoute from "@/features/pricing/model/FixedRoute";
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
import type { FixedRouteFare } from "@/features/pricing/lib/fixed-routes";
import type { TaxSettings } from "@/features/payments/lib/fare/calculate-booking-price";
import { fetchRoute } from "@/features/payments/lib/fare/route-distance";

export type PriceFailure = PromoFailure | "extra_disabled";

export async function priceServerBooking(input: {
  vehicle: IVehicle;
  booking: QuoteInput & { promoCode?: string; email?: string };
  distanceKm?: number;
  tax: TaxSettings;
  redeem?: boolean;
  now?: Date;
  /** Test seam; production always measures on the server. */
  measureRoute?: typeof fetchRoute;
}): Promise<{ ok: true; quote: FareQuote } | { ok: false; error: PriceFailure }> {
  await connectDB();
  const customerKey = input.booking.email?.trim().toLowerCase() ?? "";
  const hourly = input.booking.bookingType === "hourly";
  const [rule, routes, setting, promo] = await Promise.all([
    PricingRule.findOne().lean<Record<string, never>>() as Promise<Record<string, unknown> | null>,
    hourly ? [] : FixedRoute.find({}, { from: 1, to: 1, price: 1, bothWays: 1 }).limit(200).lean<FixedRouteFare[]>(),
    Setting.findOne({}, { timezone: 1 }).lean<{ timezone?: string }>(),
    loadPromo(input.booking.promoCode, customerKey),
  ]);
  if (!promo.ok) return promo;
  const extras = readExtras(rule?.extras as never);
  if (disabledExtrasRequested(input.booking, extras).length > 0) return { ok: false, error: "extra_disabled" };

  const measured =
    routes.length > 0 && input.booking.pickup && input.booking.dropoff
      ? await (input.measureRoute ?? fetchRoute)({
          pickup: input.booking.pickup,
          dropoff: input.booking.dropoff,
          stops: input.booking.stops,
        })
      : undefined;
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
      fixedRoutes: routes,
      endpoints: { pickup: measured?.pickup, dropoff: measured?.dropoff },
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
