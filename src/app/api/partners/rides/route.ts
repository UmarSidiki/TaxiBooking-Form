import { NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Booking } from "@/features/booking/model";
import { Partner } from "@/features/partners/model";
import { requireRole } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

export async function GET() {
  try {
    const access = await requireRole("partner");
    if (!access.ok) return access.response;

    await connectDB();
    const partner = await Partner.findById(access.session.user.id).select("status isActive");
    if (!partner || partner.status !== "approved" || partner.isActive === false) {
      return jsonError("forbidden", 403);
    }

    const bookings = await Booking.find({
      "assignedPartner._id": access.session.user.id,
    })
      .sort({ date: 1, time: 1 })
      .select("-__v")
      .limit(500);

    return NextResponse.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Error fetching partner rides:", error);
    return jsonError("internal_error", 500);
  }
}
