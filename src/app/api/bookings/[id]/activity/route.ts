import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth";
import { connectDB } from "@/shared/db";
import { Booking } from "@/features/booking/model";
import RideActivity from "@/features/rides/model/RideActivity";
import { jsonError } from "@/shared/http/json-error";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return jsonError("unauthorized", 401);
    const { id } = await params;
    await connectDB();
    const booking = await Booking.findById(id).select("assignedDriver assignedPartner").lean();
    if (!booking) return jsonError("not_found", 404);
    const role = session.user.role;
    const owns =
      role === "admin" ||
      role === "superadmin" ||
      (role === "driver" && String(booking.assignedDriver?._id) === session.user.id) ||
      (role === "partner" && String(booking.assignedPartner?._id) === session.user.id);
    if (!owns) return jsonError("forbidden", 403);
    const items = await RideActivity.find({ bookingId: id }).sort({ createdAt: 1 }).limit(100).lean();
    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("Ride activity failed:", error);
    return jsonError("internal_error", 500);
  }
}
