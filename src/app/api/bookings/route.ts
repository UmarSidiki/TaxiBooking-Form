import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/shared/db";
import { Booking } from "@/features/booking/model";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

const bookingListQuerySchema = z.object({
  status: z.enum(["upcoming", "completed", "canceled"]).optional(),
});

const BOOKING_LIST_CAP = 500;

export async function GET(request: NextRequest) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    await connectDB();
    const parsed = bookingListQuerySchema.safeParse({
      status: request.nextUrl.searchParams.get("status") ?? undefined,
    });
    if (!parsed.success) return jsonError("invalid_body", 400);

    const query = parsed.data.status ? { status: parsed.data.status } : {};
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .limit(BOOKING_LIST_CAP);

    return NextResponse.json({
      success: true,
      data: bookings,
      count: bookings.length,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return jsonError("internal_error", 500);
  }
}
