import { NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Booking } from "@/features/booking/model";
import { Partner } from "@/features/partners/model";
import { Setting } from "@/features/settings/model";
import { zonedToday } from "@/features/dashboard/lib/today-timeline";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";


export async function GET() {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;
    await connectDB();
    const settings = await Setting.findOne().select("timezone").lean<{ timezone?: string }>();
    const timeZone = settings?.timezone || "Europe/Zurich";
    const { date, hour } = zonedToday(new Date(), timeZone);
    const soon = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const [rides, unassigned, deadlines, balances] = await Promise.all([
      Booking.find({ date, status: { $nin: ["canceled"] } })
        .select("tripId time pickup dropoff status assignedDriver.name assignedPartner.name")
        .sort({ time: 1 })
        .limit(200)
        .lean(),
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
    return NextResponse.json({
      success: true,
      date,
      hour,
      timeZone,
      rides: rides.map((ride) => ({
        _id: String(ride._id),
        tripId: ride.tripId,
        time: ride.time,
        pickup: ride.pickup,
        dropoff: ride.dropoff,
        status: ride.status,
        driverName: ride.assignedDriver?.name,
        partnerName: ride.assignedPartner?.name,
      })),
      unassigned,
      deadlines,
      balances,
    });
  } catch (error) {
    console.error("Admin today failed:", error);
    return jsonError("internal_error", 500);
  }
}
