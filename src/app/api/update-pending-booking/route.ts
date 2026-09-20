import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { PendingBooking } from "@/features/booking/model";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { pendingBookingUpdateSchema } from "@/features/booking/schema/checkout.schema";

const CONTACT_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "notes",
  "flightNumber",
] as const;

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request, pendingBookingUpdateSchema);
    if (!parsed.ok) return parsed.response;
    const { orderId, bookingData } = parsed.data;

    await connectDB();

    const existing = await PendingBooking.findOne({ orderId });
    if (!existing) {
      return jsonError("not_found", 404);
    }

    const nextBookingData = { ...existing.bookingData };
    for (const field of CONTACT_FIELDS) {
      const value = bookingData[field];
      if (value !== undefined) {
        nextBookingData[field] = value;
      }
    }

    existing.bookingData = nextBookingData;
    existing.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await existing.save();

    return NextResponse.json({
      success: true,
      orderId: existing.orderId,
    });
  } catch (error) {
    console.error("Error updating pending booking:", error);
    return jsonError("internal_error", 500);
  }
}
