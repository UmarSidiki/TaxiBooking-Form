import type Stripe from "stripe";
import type { HydratedDocument } from "mongoose";
import { PendingBooking } from "@/features/booking/model";
import type { IPendingBooking } from "@/features/booking/model/PendingBooking";
import { jsonError } from "@/shared/http/json-error";
import type { checkoutSessionBodySchema } from "@/features/payments/schema/checkout-session.schema";
import type { z } from "zod";

export type CheckoutSessionInput = z.infer<typeof checkoutSessionBodySchema>;

export type OpenCheckoutSessionResult =
  | {
      ok: true;
      clientSecret: string;
      paymentIntentId: string;
      orderId: string;
      amount: number;
      currency: string;
      status: string;
    }
  | { ok: false; response: ReturnType<typeof jsonError> };

const PENDING_TTL_MS = 48 * 60 * 60 * 1000;

/** Stripe statuses we can still hand back to the client for confirmation. */
const REUSABLE_STATUSES = new Set([
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
  "processing",
  "succeeded",
]);

export function isReusableIntent(intent: Stripe.PaymentIntent) {
  return REUSABLE_STATUSES.has(intent.status);
}

export async function storePendingIntent(input: {
  draftId: string;
  orderId: string;
  existing: HydratedDocument<IPendingBooking> | null;
  intent: Stripe.PaymentIntent;
  bookingData: CheckoutSessionInput["bookingData"];
  priced: {
    total: number;
    subtotal: number;
    taxAmount: number;
    taxPercentage: number;
    depositDue: number;
    balanceDue: number;
    lines: { code: string; amount: number }[];
    promoCode?: string;
    chargeAmount: number;
  };
}) {
  const document = {
    bookingData: {
      ...input.bookingData,
      totalAmount: input.priced.total,
      subtotalAmount: input.priced.subtotal,
      taxAmount: input.priced.taxAmount,
      taxPercentage: input.priced.taxPercentage,
      depositDue: input.priced.depositDue,
      balanceDue: input.priced.balanceDue,
      fareLines: input.priced.lines,
      promoCode: input.priced.promoCode,
    },
    paymentMethod: "stripe",
    stripePaymentIntentId: input.intent.id,
    status: "open" as const,
    expectedAmount: input.priced.chargeAmount,
    expiresAt: new Date(Date.now() + PENDING_TTL_MS),
  };

  if (input.existing) {
    input.existing.set(document);
    await input.existing.save();
    return;
  }

  try {
    await PendingBooking.create({
      draftId: input.draftId,
      orderId: input.orderId,
      ...document,
    });
  } catch (error) {
    // A concurrent request may have created the draft first. Keep that row.
    const raced = await PendingBooking.findOne({ draftId: input.draftId });
    if (!raced) throw error;
    raced.set(document);
    await raced.save();
  }
}
