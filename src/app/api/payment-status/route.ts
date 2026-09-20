import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/shared/db";
import { Booking } from "@/features/booking/model";
import { jsonError } from "@/shared/http/json-error";

export const dynamic = "force-dynamic";

const paymentStatusQuerySchema = z
  .object({
    tripId: z.string().min(1).optional(),
    paymentIntentId: z.string().min(1).optional(),
    transactionId: z.string().min(1).optional(),
  })
  .refine(
    (value) => Boolean(value.tripId || value.paymentIntentId || value.transactionId)
  );

export async function GET(request: NextRequest) {
  try {
    const parsed = paymentStatusQuerySchema.safeParse({
      tripId: request.nextUrl.searchParams.get("tripId") ?? undefined,
      paymentIntentId:
        request.nextUrl.searchParams.get("paymentIntentId") ?? undefined,
      transactionId:
        request.nextUrl.searchParams.get("transactionId") ?? undefined,
    });
    if (!parsed.success) return jsonError("invalid_body", 400);

    await connectDB();
    const { tripId, paymentIntentId, transactionId } = parsed.data;
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
      .select("tripId confirmationEmailSent adminNotificationSent")
      .lean();

    if (!booking) {
      return NextResponse.json({
        success: true,
        finalized: false,
      });
    }

    return NextResponse.json({
      success: true,
      finalized: true,
      tripId: booking.tripId,
      emailsComplete: Boolean(
        booking.confirmationEmailSent && booking.adminNotificationSent
      ),
    });
  } catch (error) {
    console.error("payment-status error:", error);
    return jsonError("internal_error", 500);
  }
}
