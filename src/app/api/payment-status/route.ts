import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/shared/db";
import { Booking, PendingBooking } from "@/features/booking/model";
import { jsonError } from "@/shared/http/json-error";

export const dynamic = "force-dynamic";

const paymentStatusQuerySchema = z
  .object({
    tripId: z.string().min(1).optional(),
    paymentIntentId: z.string().min(1).optional(),
    transactionId: z.string().min(1).optional(),
    draftId: z.string().uuid().optional(),
  })
  .refine(
    (value) =>
      Boolean(
        value.tripId || value.paymentIntentId || value.transactionId || value.draftId
      )
  );

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const parsed = paymentStatusQuerySchema.safeParse({
      tripId: params.get("tripId") ?? undefined,
      paymentIntentId: params.get("paymentIntentId") ?? undefined,
      transactionId: params.get("transactionId") ?? undefined,
      draftId: params.get("draftId") ?? undefined,
    });
    if (!parsed.success) return jsonError("invalid_body", 400);

    await connectDB();
    const { tripId, paymentIntentId, transactionId, draftId } = parsed.data;

    if (draftId) {
      return await draftStatus(draftId);
    }

    const orConditions: Record<string, string>[] = [];
    if (tripId) {
      orConditions.push({ tripId }, { multisafepayOrderId: tripId });
    }
    if (paymentIntentId) {
      orConditions.push({ stripePaymentIntentId: paymentIntentId });
    }
    if (transactionId) {
      orConditions.push({ multisafepayTransactionId: transactionId });
    }

    const booking = await Booking.findOne({
      $or: orConditions,
      paymentStatus: "completed",
    })
      .select(
        "tripId totalAmount paymentMethod confirmationEmailSent adminNotificationSent"
      )
      .lean();

    if (!booking) {
      return NextResponse.json({ success: true, finalized: false });
    }

    return NextResponse.json({
      success: true,
      finalized: true,
      tripId: booking.tripId,
      amount: booking.totalAmount ?? null,
      paymentMethod: booking.paymentMethod ?? null,
      emailsComplete: Boolean(
        booking.confirmationEmailSent && booking.adminNotificationSent
      ),
    });
  } catch (error) {
    console.error("payment-status error:", error);
    return jsonError("internal_error", 500);
  }
}

async function draftStatus(draftId: string) {
  const booking = await Booking.findOne({ draftId })
    .select(
      "tripId totalAmount paymentMethod paymentStatus confirmationEmailSent adminNotificationSent"
    )
    .lean();

  if (booking) {
    return NextResponse.json({
      success: true,
      finalized: booking.paymentStatus === "completed",
      tripId: booking.tripId,
      amount: booking.totalAmount ?? null,
      paymentMethod: booking.paymentMethod ?? null,
      emailsComplete: Boolean(
        booking.confirmationEmailSent && booking.adminNotificationSent
      ),
    });
  }

  const pending = await PendingBooking.findOne({ draftId })
    .select("orderId bookingData paymentMethod status expectedAmount")
    .lean();

  if (!pending) {
    return NextResponse.json({ success: true, finalized: false, found: false });
  }

  return NextResponse.json({
    success: true,
    finalized: false,
    found: true,
    processing: pending.status === "open",
    tripId: pending.orderId,
    amount: pending.bookingData?.totalAmount ?? pending.expectedAmount ?? null,
    paymentMethod: pending.paymentMethod ?? null,
  });
}
