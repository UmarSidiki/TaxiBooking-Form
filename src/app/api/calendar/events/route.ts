import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Booking } from "@/features/booking/model";
import DriverTimeOff from "@/features/drivers/model/DriverTimeOff";
import { jsonError } from "@/shared/http/json-error";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return jsonError("unauthorized", 401);
    const role = session.user.role ?? "";
    if (!["admin", "superadmin", "driver", "partner"].includes(role)) {
      return jsonError("forbidden", 403);
    }
    const from = request.nextUrl.searchParams.get("from") ?? "";
    const to = request.nextUrl.searchParams.get("to") ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return jsonError("invalid_body", 400);
    }

    await connectDB();
    const query: Record<string, unknown> = {
      status: { $in: ["upcoming", "completed"] },
      date: { $gte: from, $lte: to },
    };
    if (role === "driver") query["assignedDriver._id"] = session.user.id;
    if (role === "partner") query["assignedPartner._id"] = session.user.id;

    const rides = await Booking.find(query)
      .select("tripId date time pickup dropoff assignedDriver assignedPartner driverRideStatus")
      .sort({ date: 1, time: 1 })
      .limit(300)
      .lean();

    const timeOff = role === "admin" || role === "superadmin" || role === "driver"
      ? await DriverTimeOff.find(role === "driver" ? { driverId: session.user.id } : {})
          .select("driverId startsAt endsAt note")
          .limit(100)
          .lean()
      : [];

    return NextResponse.json({ success: true, rides, timeOff });
  } catch (error) {
    console.error("Calendar events failed:", error);
    return jsonError("internal_error", 500);
  }
}
