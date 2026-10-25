import { NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Booking } from "@/features/booking/model";
import { Partner } from "@/features/partners/model";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;
    await connectDB();
    const date = todayStamp();
    const soon = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const [unassigned, deadlines, balances] = await Promise.all([
      Booking.find({
        date,
        status: "upcoming",
        "assignedDriver._id": { $exists: false },
        "assignedPartner._id": { $exists: false },
      })
        .select("tripId time pickup dropoff")
        .limit(50)
        .lean(),
      Booking.find({
        availableForPartners: true,
        partnerAcceptanceDeadline: { $lte: soon, $gte: new Date() },
      })
        .select("tripId time pickup partnerAcceptanceDeadline")
        .limit(50)
        .lean(),
      Partner.find({ balance: { $lt: 0 } })
        .select("name balance phone")
        .sort({ balance: 1 })
        .limit(20)
        .lean(),
    ]);
    return NextResponse.json({ success: true, date, unassigned, deadlines, balances });
  } catch (error) {
    console.error("Admin today failed:", error);
    return jsonError("internal_error", 500);
  }
}
