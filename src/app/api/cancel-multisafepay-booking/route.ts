import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Booking } from "@/features/booking/model";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { cancelMultisafepayBodySchema } from "@/features/payments/schema/checkout.schema";

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request, cancelMultisafepayBodySchema);
    if (!parsed.ok) return parsed.response;
    const { transactionId, orderId } = parsed.data;

    await connectDB();

    if (orderId) {
      const { PendingBooking } = await import("@/features/booking/model");
      const pendingBooking = await PendingBooking.findOne({ orderId });

      if (pendingBooking) {
        await PendingBooking.deleteOne({ orderId });
        return NextResponse.json({ success: true });
      }
    }

    const booking = await Booking.findOne({
      $or: [
        { multisafepayTransactionId: transactionId },
        { multisafepayOrderId: orderId },
        { tripId: orderId },
      ],
    });

    if (!booking) {
      return NextResponse.json({ success: true });
    }

    if (booking.paymentStatus === "pending") {
      booking.status = "canceled";
      booking.paymentStatus = "failed";
      booking.canceledAt = new Date();
      await booking.save();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return jsonError("internal_error", 500);
  }
}
