import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { blockIfCountryNotAllowed } from "@/features/geo/lib/booking-country-policy";
import { checkoutSessionBodySchema } from "@/features/payments/schema/checkout-session.schema";
import { openCheckoutSession } from "@/features/payments/lib/checkout/open-checkout-session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request, checkoutSessionBodySchema);
    if (!parsed.ok) return parsed.response;

    const country = await blockIfCountryNotAllowed(request);
    if (!country.ok) {
      return jsonError("country_blocked", 403);
    }

    const result = await openCheckoutSession(parsed.data, request);
    if (!result.ok) return result.response;

    return NextResponse.json({
      success: true,
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
      orderId: result.orderId,
      amount: result.amount,
      currency: result.currency,
      status: result.status,
    });
  } catch (error) {
    console.error("Error opening checkout session:", error);
    return jsonError("internal_error", 500);
  }
}
