import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { findBookingByPaymentToken } from "@/features/booking/lib/find-booking-by-payment-token";
import { updateBookingFields } from "@/features/booking/lib/booking.repo";
import { getStripeClient } from "@/features/payments/lib/stripe-client";
import { DEFAULT_STRIPE_CURRENCY } from "@/features/payments/lib/stripe-currency";
import { Setting } from "@/features/settings/model";
import { jsonError } from "@/shared/http/json-error";
import { registerPaymentMethodDomain } from "@/features/payments/lib/register-payment-method-domain";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    await connectDB();
    const booking = await findBookingByPaymentToken(token);

    if (!booking || booking.status !== "awaiting_payment") {
      return jsonError("not_found", 404);
    }

    const amount = Number(booking.quotedAmount ?? booking.totalAmount ?? 0);
    if (!(amount > 0)) {
      return jsonError("invalid_body", 400);
    }

    const settings = await Setting.findOne();
    const stripe = await getStripeClient();
    if (!stripe) {
      return jsonError("payment_not_configured", 500);
    }

    const currency = (
      settings?.stripeCurrency || DEFAULT_STRIPE_CURRENCY
    ).toLowerCase();
    const statementDescriptor =
      settings?.stripeStatementDescriptor || "BOOKING";

    void registerPaymentMethodDomain(stripe, request);

    const quotedAtMs = booking.quotedAt
      ? new Date(booking.quotedAt).getTime()
      : Date.now();

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: Math.round(amount * 100),
        currency,
        automatic_payment_methods: { enabled: true },
        statement_descriptor_suffix: statementDescriptor.substring(0, 22),
        description: `Quote payment #${booking.tripId}`,
        receipt_email: booking.email,
        metadata: {
          service: "quote",
          order_id: booking.tripId,
          booking_id: String(booking._id),
          trip_id: booking.tripId,
        },
      },
      {
        idempotencyKey: `quote_${booking.tripId}_${Math.round(amount * 100)}_${quotedAtMs}`,
      }
    );

    await updateBookingFields(String(booking._id), {
      stripePaymentIntentId: paymentIntent.id,
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      orderId: booking.tripId,
      publishableKey: settings?.stripePublishableKey || null,
    });
  } catch (error) {
    console.error("POST /api/pay/[token]/intent:", error);
    return jsonError("internal_error", 500);
  }
}
