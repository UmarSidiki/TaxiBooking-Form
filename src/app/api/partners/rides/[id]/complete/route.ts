import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { findBookingById } from "@/features/booking/lib/booking.repo";
import { patchBooking } from "@/features/booking/lib/patch-booking.service";
import { resolvePublicUrl } from "@/features/settings/lib/public-url";
import { requireRole } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireRole("partner");
    if (!access.ok) return access.response;
    const { id } = await params;
    await connectDB();
    const booking = await findBookingById(id);
    if (!booking) return jsonError("not_found", 404);
    if (String(booking.assignedPartner?._id) !== access.session.user.id) {
      return jsonError("forbidden", 403);
    }
    if (booking.status !== "upcoming") return jsonError("conflict", 409);

    const result = await patchBooking(
      id,
      { action: "complete" },
      (await resolvePublicUrl({ request })) ?? undefined,
      { id: access.session.user.id, role: "partner" },
    );
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: "invalid_body", message: result.message },
        { status: result.status },
      );
    }
    return NextResponse.json({ success: true, data: result.booking });
  } catch (error) {
    console.error("Partner complete failed:", error);
    return jsonError("internal_error", 500);
  }
}
