import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { bookingPatchSuccessMessage } from "@/features/booking/lib/booking-patch-message";
import {
  deleteBookingById,
  findBookingById,
} from "@/features/booking/lib/booking.repo";
import { patchBooking } from "@/features/booking/lib/patch-booking.service";
import { resolveBookingRequestBaseUrl } from "@/features/booking/lib/resolve-booking-request-base-url";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError, jsonErrorFromStatus } from "@/shared/http/json-error";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { bookingPatchBodySchema } from "@/features/booking/schema/booking-patch.schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const booking = await findBookingById(id);
    if (!booking) return jsonError("not_found", 404);
    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return jsonError("internal_error", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id } = await params;
    const parsed = await parseJsonBody(request, bookingPatchBodySchema);
    if (!parsed.ok) return parsed.response;

    const result = await patchBooking(
      id,
      parsed.data,
      resolveBookingRequestBaseUrl(request)
    );
    if (!result.ok) {
      if (result.message && result.message !== "invalid_body") {
        return NextResponse.json(
          { success: false, error: "invalid_body", message: result.message },
          { status: result.status }
        );
      }
      return jsonErrorFromStatus(result.status);
    }

    return NextResponse.json({
      success: true,
      message: bookingPatchSuccessMessage(result.action),
      data: result.booking,
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    return jsonError("internal_error", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    await connectDB();
    const { id } = await params;
    const deletedBooking = await deleteBookingById(id);
    if (!deletedBooking) return jsonError("not_found", 404);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return jsonError("internal_error", 500);
  }
}
