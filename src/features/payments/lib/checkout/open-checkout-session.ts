import type Stripe from "stripe";
import type { NextRequest } from "next/server";
import { Setting } from "@/features/settings/model";
import { PendingBooking } from "@/features/booking/model";
import { Vehicle } from "@/features/fleet/model";
import { connectDB } from "@/shared/db";
import { generateShortId } from "@/shared/lib/generate-id";
import { isValidEmail } from "@/shared/lib/validation";
import { jsonError } from "@/shared/http/json-error";
import { priceServerBooking } from "@/features/pricing/lib/price-server-booking";
import { fetchRouteDistanceKm } from "@/features/payments/lib/fare/route-distance";
import { getStripeClient } from "@/features/payments/lib/stripe-client";
import { DEFAULT_STRIPE_CURRENCY } from "@/features/payments/lib/stripe-currency";
import { registerPaymentMethodDomain } from "@/features/payments/lib/register-payment-method-domain";
import {
  isReusableIntent,
  storePendingIntent,
  type CheckoutSessionInput,
  type OpenCheckoutSessionResult,
} from "@/features/payments/lib/checkout/pending-intent";
import {
  createCheckoutIntent,
  freshIdempotencyKey,
} from "@/features/payments/lib/checkout/create-checkout-intent";

function intentMetadata(input: {
  orderId: string;
  draftId: string;
  email?: string;
  name?: string;
  purpose: string;
}) {
  return {
    service: "booking",
    purpose: input.purpose,
    order_id: input.orderId,
    draft_id: input.draftId,
    ...(input.email ? { customer_email: input.email } : {}),
    ...(input.name ? { customer_name: input.name } : {}),
  };
}

function purposeFor(method: "card" | "cash" | "appointment") {
  if (method === "cash") return "cash_deposit" as const;
  if (method === "appointment") return "appointment_deposit" as const;
  return "booking" as const;
}

function createParams(input: {
  amountCents: number;
  currency: string;
  descriptor: string;
  description?: string;
  metadata: Record<string, string>;
  email?: string;
  saveCards?: boolean;
}): Stripe.PaymentIntentCreateParams {
  const params: Stripe.PaymentIntentCreateParams = {
    amount: input.amountCents,
    currency: input.currency,
    automatic_payment_methods: { enabled: true },
    statement_descriptor_suffix: input.descriptor.substring(0, 22),
    description: input.description || "Booking payment",
    metadata: input.metadata,
  };
  if (input.email) {
    params.receipt_email = input.email;
  }
  if (input.saveCards) {
    params.payment_method_options = {
      card: { setup_future_usage: "off_session" },
    };
  }
  return params;
}

export async function openCheckoutSession(
  input: CheckoutSessionInput,
  request: NextRequest
): Promise<OpenCheckoutSessionResult> {
  await connectDB();

  const { draftId, bookingData } = input;
  const depositMethod = input.paymentMethod ?? "card";
  const purpose = purposeFor(depositMethod);
  const pendingMethod =
    depositMethod === "cash" ? "cash" : depositMethod === "appointment" ? "unpaid" : "stripe";
  const settings = await Setting.findOne();
  const stripe = await getStripeClient();
  if (!stripe) {
    return { ok: false, response: jsonError("payment_not_configured", 500) };
  }

  const vehicle = await Vehicle.findById(bookingData.selectedVehicle);
  if (!vehicle) {
    return { ok: false, response: jsonError("not_found", 400) };
  }

  if (
    bookingData.bookingType !== "hourly" &&
    (!bookingData.pickup || !bookingData.dropoff)
  ) {
    return { ok: false, response: jsonError("invalid_body", 400) };
  }

  const distanceKm =
    bookingData.bookingType === "hourly"
      ? undefined
      : await fetchRouteDistanceKm({
          pickup: bookingData.pickup ?? "",
          dropoff: bookingData.dropoff ?? "",
          stops: bookingData.stops,
        });

  if (
    bookingData.bookingType !== "hourly" &&
    bookingData.pickup &&
    bookingData.dropoff &&
    distanceKm == null
  ) {
    return { ok: false, response: jsonError("distance_failed", 400) };
  }

  const serverPrice = await priceServerBooking({
    enforceServiceArea: true,
    vehicle,
    booking: bookingData,
    distanceKm,
    tax: settings || {},
    redeem: true,
    paymentMethod: depositMethod,
  });
  if (!serverPrice.ok) {
    return { ok: false, response: jsonError(serverPrice.error, 400) };
  }

  const priced = serverPrice.quote;
  if (!priced.total || priced.total <= 0) {
    return { ok: false, response: jsonError("invalid_body", 400) };
  }

  const email = input.customerEmail && isValidEmail(input.customerEmail)
    ? input.customerEmail.trim()
    : undefined;
  const name =
    typeof input.customerName === "string" &&
    input.customerName.trim() &&
    !/^First Last$/i.test(input.customerName.trim())
      ? input.customerName.trim()
      : undefined;

  const existing = await PendingBooking.findOne({ draftId });
  const orderId = existing?.orderId ?? generateShortId(5);
  const amountCents = Math.round(priced.chargeAmount * 100);
  const currency = (settings?.stripeCurrency || DEFAULT_STRIPE_CURRENCY).toLowerCase();
  const descriptor = settings?.stripeStatementDescriptor || "BOOKING";
  const metadata = intentMetadata({ orderId, draftId, email, name, purpose });

  let intent: Stripe.PaymentIntent | null = null;

  if (existing?.stripePaymentIntentId) {
    try {
      const current = await stripe.paymentIntents.retrieve(
        existing.stripePaymentIntentId
      );
      const samePurpose =
        !current.metadata?.purpose || current.metadata.purpose === purpose;
      // A paid or in-flight intent must never be replaced by a second charge.
      // Return it as-is so the client finalizes or waits instead of
      // re-collecting. Terminal intents are also never handed to Elements.
      if (current.status === "succeeded" || current.status === "processing") {
        intent = current;
      } else if (samePurpose && isReusableIntent(current)) {
        // Reusable means no cancel reached it (a canceled intent is replaced
        // below), so keeping it also keeps its amount in sync with the quote.
        if (
          current.status === "requires_payment_method" &&
          current.amount !== amountCents
        ) {
          intent = await stripe.paymentIntents.update(current.id, {
            amount: amountCents,
            currency,
            description: input.description || "Booking payment",
            metadata,
            ...(email ? { receipt_email: email } : {}),
          });
        } else {
          intent = current;
        }
      }
    } catch (error) {
      console.warn("Could not reuse checkout PaymentIntent:", error);
    }
  }

  if (!intent) {
    const key = `pi_${purpose}_${draftId}_${amountCents}`;
    const params = createParams({
      amountCents,
      currency,
      descriptor,
      description: input.description,
      metadata,
      email,
      saveCards: settings?.stripeSaveCards,
    });
    intent = await createCheckoutIntent(stripe, params, key);
    // Stripe may replay a canceled intent for a reused key. A canceled intent
    // can never be confirmed, so retry once under a fresh key.
    if (intent.status === "canceled") {
      intent = await createCheckoutIntent(
        stripe,
        params,
        freshIdempotencyKey(key)
      );
    }
  }

  await storePendingIntent({
    draftId,
    orderId,
    existing,
    intent,
    bookingData,
    priced,
    paymentMethod: pendingMethod,
    purpose,
  });

  void registerPaymentMethodDomain(stripe, request);

  const terminal =
    intent.status === "succeeded" ||
    intent.status === "processing" ||
    intent.status === "canceled";
  return {
    ok: true,
    // Terminal intents must not be used to initialize Elements.
    clientSecret: terminal ? "" : (intent.client_secret ?? ""),
    paymentIntentId: intent.id,
    orderId,
    amount: intent.amount / 100,
    currency: intent.currency,
    status: intent.status,
  };
}
