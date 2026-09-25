import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/shared/db";
import { Booking } from "@/features/booking/model";
import { createDeskBooking } from "@/features/desk-booking/lib/create-desk-booking.service";
import { isDeskBookingEnabled } from "@/features/desk-booking/lib/is-desk-booking-enabled";
import { parseDeskBookingInput } from "@/features/desk-booking/schema/desk-booking.schema";
import { resolveBookingRequestBaseUrl } from "@/features/booking/lib/resolve-booking-request-base-url";
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

export async function POST(request: NextRequest) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    if (!(await isDeskBookingEnabled())) {
      return jsonError("forbidden", 403);
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return jsonError("invalid_body", 400);
    }

    const parsed = parseDeskBookingInput(raw);
    if (!parsed.success) return jsonError(parsed.error, 400);

    const user = access.session.user;
    const result = await createDeskBooking(
      parsed.data,
      { userId: user.id, name: user.name ?? user.email ?? undefined },
      resolveBookingRequestBaseUrl(request)
    );

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: "invalid_body", message: result.message },
        { status: result.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          bookingId: result.bookingId,
          tripId: result.tripId,
          totalAmount: result.totalAmount,
          outcome: result.outcome,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating desk booking:", error);
    return jsonError("internal_error", 500);
  }
}
