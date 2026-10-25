import { Booking } from "@/features/booking/model";
import RideCharge from "@/features/invoices/model/RideCharge";
import { fetchMultisafepayOrder } from "@/features/payments/lib/multisafepay-api";
import { getStripeClient } from "@/features/payments/lib/stripe-client";
import { Setting } from "@/features/settings/model";
import { connectDB } from "@/shared/db";

const TOLERANCE = 0.05;

export async function settleRideCharge(input: { paymentIntentId?: string; orderId?: string }) {
  await connectDB();
  const charge = input.paymentIntentId
    ? await RideCharge.findOne({ paymentIntentId: input.paymentIntentId })
    : await RideCharge.findOne({ orderId: input.orderId });
  if (!charge) return { ok: false as const, retryable: false };
  if (charge.status === "paid") return { ok: true as const };

  if (charge.provider === "stripe" && charge.paymentIntentId) {
    const stripe = await getStripeClient();
    if (!stripe) return { ok: false as const, retryable: true };
    const intent = await stripe.paymentIntents.retrieve(charge.paymentIntentId);
    if (intent.status !== "succeeded") return { ok: false as const, retryable: true };
    const paid = (intent.amount_received || intent.amount) / 100;
    if (paid + TOLERANCE < charge.amount) return { ok: false as const, retryable: false };
  }

  if (charge.provider === "multisafepay") {
    const settings = await Setting.findOne();
    if (!settings?.multisafepayApiKey) return { ok: false as const, retryable: true };
    const order = await fetchMultisafepayOrder(
      settings.multisafepayApiKey,
      settings.multisafepayTestMode ?? true,
      charge.orderId,
    );
    if (!order.ok) return { ok: false as const, retryable: true };
    const status = (order.data.status || "").toLowerCase();
    if (status !== "completed" && status !== "shipped") return { ok: false as const, retryable: true };
    const paid = (order.data.amount ?? 0) / 100;
    if (paid + TOLERANCE < charge.amount) return { ok: false as const, retryable: false };
  }

  const booking = await Booking.findOne({ tripId: charge.tripId });
  if (!booking) return { ok: false as const, retryable: false };
  if (charge.purpose === "balance" || charge.purpose === "full") {
    booking.balanceDue = 0;
    booking.depositDue = charge.purpose === "full" ? 0 : booking.depositDue;
  }
  booking.paymentStatus = "completed";
  charge.status = "paid";
  await Promise.all([booking.save(), charge.save()]);
  return { ok: true as const };
}
