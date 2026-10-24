import type { IVehicle } from "@/features/fleet/model";
import { connectDB } from "@/shared/db";
import PricingRule from "@/features/pricing/model/PricingRule";
import ZonePrice from "@/features/pricing/model/ZonePrice";
import { loadPromo, redeemPromo, type PromoFailure } from "@/features/pricing/lib/redeem-promo";
import { quoteFare, type FareQuote, type QuoteInput } from "@/features/pricing/lib/quote-fare";
import type { TaxSettings } from "@/features/payments/lib/fare/calculate-booking-price";

export async function priceServerBooking(input: {
  vehicle: IVehicle;
  booking: QuoteInput & { promoCode?: string; email?: string };
  distanceKm?: number;
  tax: TaxSettings;
  redeem?: boolean;
}): Promise<{ ok: true; quote: FareQuote } | { ok: false; error: PromoFailure }> {
  await connectDB();
  const customerKey = input.booking.email?.trim().toLowerCase() ?? "";
  const [rule, zones, promo] = await Promise.all([
    PricingRule.findOne().lean(),
    ZonePrice.find().limit(200).lean(),
    loadPromo(input.booking.promoCode, customerKey),
  ]);
  if (!promo.ok) return promo;
  const quote = quoteFare(
    input.vehicle,
    input.booking,
    input.tax,
    input.distanceKm,
    {
      zones: zones.map((zone) => ({
        fromLabel: zone.fromLabel,
        toLabel: zone.toLabel,
        price: zone.price,
      })),
      night: rule
        ? { start: rule.nightStart, end: rule.nightEnd, percent: rule.nightPercent }
        : undefined,
      holidays: rule?.holidays ?? [],
      meetGreetPrice: rule?.meetGreetPrice ?? 0,
      operatorMinimumFare: rule?.operatorMinimumFare ?? 0,
    },
    promo.promo,
  );
  if (input.redeem && promo.promo && quote.promoCode) {
    const redeemed = await redeemPromo(promo.promo.id, customerKey);
    if (!redeemed.ok) return redeemed;
  }
  return { ok: true, quote };
}
