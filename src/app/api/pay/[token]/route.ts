import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { findBookingByPaymentToken } from "@/features/booking/lib/find-booking-by-payment-token";
import { jsonError } from "@/shared/http/json-error";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    await connectDB();
    const booking = await findBookingByPaymentToken(token);

    if (!booking) {
      return NextResponse.json(
        { success: false, state: "not_found" },
        { status: 404 }
      );
    }

    if (booking.status === "canceled") {
      return NextResponse.json({
        success: true,
        state: "declined",
        tripId: booking.tripId,
      });
    }

    if (
      booking.paymentStatus === "completed" ||
      booking.status === "upcoming" ||
      booking.status === "completed"
    ) {
      return NextResponse.json({
        success: true,
        state: "already_paid",
        tripId: booking.tripId,
      });
    }

    if (booking.status !== "awaiting_payment") {
      return NextResponse.json({
        success: false,
        state: "not_found",
      });
    }

    return NextResponse.json({
      success: true,
      state: "awaiting_payment",
      tripId: booking.tripId,
      pickup: booking.pickup,
      dropoff: booking.dropoff,
      date: booking.date,
      time: booking.time,
      totalAmount: booking.totalAmount ?? booking.quotedAmount ?? 0,
      vehicleName: booking.vehicleDetails?.name,
      firstName: booking.firstName,
      locale: booking.locale,
    });
  } catch (error) {
    console.error("GET /api/pay/[token]:", error);
    return jsonError("internal_error", 500);
  }
}
