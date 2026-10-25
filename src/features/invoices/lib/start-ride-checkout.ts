import { Booking } from "@/features/booking/model";
import RideCharge from "@/features/invoices/model/RideCharge";
import { rideAmountDue } from "@/features/invoices/lib/ride-amount-due";
import type { NextRequest } from "next/server";
import { getStripeClient } from "@/features/payments/lib/stripe-client";
import { resolvePublicBaseUrl } from "@/features/payments/lib/resolve-base-url";
import { Setting } from "@/features/settings/model";
import { connectDB } from "@/shared/db";
import { generateShortId } from "@/shared/lib/generate-id";

type StripeCheckout = {
  paymentIntents: {
    create: (params: {
      amount: number;
      currency: string;
      automatic_payment_methods: { enabled: boolean };
      description: string;
      metadata: Record<string, string>;
    }) => Promise<{ id: string; client_secret: string | null }>;
    retrieve: (id: string) => Promise<{ client_secret: string | null; status: string }>;
  };
};

export async function ridePaySummary(tripId: string) {
  await connectDB();
  const booking = await Booking.findOne({ tripId }).lean();
  if (!booking) return null;
  const due = rideAmountDue(booking);
  const settings = await Setting.findOne().lean();
  return {
    tripId: booking.tripId,
    pickup: booking.pickup,
    dropoff: booking.dropoff,
    date: booking.date,
    time: booking.time,
    locale: booking.locale,
    ...due,
    currency: (settings?.stripeCurrency || "eur").toLowerCase(),
    publishableKey: settings?.stripePublishableKey || null,
    stripeReady: Boolean(settings?.stripeSecretKey || process.env.STRIPE_SECRET_KEY),
    multisafepayReady: Boolean(settings?.multisafepayApiKey),
    bank: {
      name: settings?.bankName || "",
      accountName: settings?.bankAccountName || "",
      accountNumber: settings?.bankAccountNumber || "",
      iban: settings?.bankIBAN || "",
      swift: settings?.bankSwiftBIC || "",
    },
  };
}

export async function startRideCheckout(
  tripId: string,
  request: Request,
  stripeClient?: StripeCheckout | null,
) {
  const summary = await ridePaySummary(tripId);
  if (!summary) return { ok: false as const, status: 404, error: "not_found" };
  if (summary.amountDue <= 0) return { ok: true as const, state: "paid" as const, summary };

  const stripe = stripeClient === undefined ? ((await getStripeClient()) as StripeCheckout | null) : stripeClient;
  if (stripe) return openStripe(summary, stripe);
  if (summary.multisafepayReady) return openMultisafepay(summary, request);
  return { ok: true as const, state: "cash" as const, summary };
}

async function openStripe(
  summary: NonNullable<Awaited<ReturnType<typeof ridePaySummary>>>,
  stripe: StripeCheckout,
) {
  const open = await RideCharge.findOne({
    tripId: summary.tripId,
    status: "pending",
    amount: summary.amountDue,
    provider: "stripe",
  });
  if (open?.paymentIntentId) {
    const existing = await stripe.paymentIntents.retrieve(open.paymentIntentId);
    if (existing.client_secret && existing.status !== "canceled" && existing.status !== "succeeded") {
      return { ok: true as const, state: "stripe" as const, summary, clientSecret: existing.client_secret, orderId: open.orderId };
    }
  }
  const orderId = `due_${generateShortId(8)}`;
  const intent = await stripe.paymentIntents.create({
    amount: Math.round(summary.amountDue * 100),
    currency: summary.currency,
    automatic_payment_methods: { enabled: true },
    description: `Ride ${summary.tripId}`,
    metadata: { kind: "ride_due", order_id: orderId, trip_id: summary.tripId },
  });
  await RideCharge.create({
    orderId,
    tripId: summary.tripId,
    amount: summary.amountDue,
    purpose: summary.purpose,
    provider: "stripe",
    paymentIntentId: intent.id,
  });
  return { ok: true as const, state: "stripe" as const, summary, clientSecret: intent.client_secret, orderId };
}

async function openMultisafepay(
  summary: NonNullable<Awaited<ReturnType<typeof ridePaySummary>>>,
  request: Request,
) {
  const settings = await Setting.findOne();
  const baseUrl = resolvePublicBaseUrl(request as NextRequest);
  if (!settings?.multisafepayApiKey || !baseUrl) {
    return { ok: true as const, state: "cash" as const, summary };
  }
  const orderId = `due_${generateShortId(8)}`;
  const apiUrl = settings.multisafepayTestMode === false
    ? "https://api.multisafepay.com/v1/json/orders"
    : "https://testapi.multisafepay.com/v1/json/orders";
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", api_key: settings.multisafepayApiKey },
    body: JSON.stringify({
      type: "redirect",
      order_id: orderId,
      currency: summary.currency.toUpperCase(),
      amount: Math.round(summary.amountDue * 100),
      description: `Ride ${summary.tripId}`,
      payment_options: {
        notification_url: `${baseUrl}/api/multisafepay-webhook?order_id=${orderId}`,
        notification_method: "GET",
        redirect_url: `${baseUrl}/${summary.locale || "en"}/pay/ride/return`,
        cancel_url: `${baseUrl}/${summary.locale || "en"}/pay/ride/return`,
      },
    }),
  });
  const data = (await response.json()) as { success?: boolean; data?: { payment_url?: string } };
  if (!response.ok || !data.success || !data.data?.payment_url) {
    return { ok: false as const, status: 502, error: "payment_failed" };
  }
  await RideCharge.create({
    orderId,
    tripId: summary.tripId,
    amount: summary.amountDue,
    purpose: summary.purpose,
    provider: "multisafepay",
  });
  return { ok: true as const, state: "multisafepay" as const, summary, paymentUrl: data.data.payment_url, orderId };
}
