import { NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Booking } from "@/features/booking/model";
import { driverWorks } from "@/features/drivers/lib/driver-approval";
import { Driver } from "@/features/drivers/model";
import { requireRole } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

export async function GET() {
  try {
    const access = await requireRole("driver");
    if (!access.ok) return access.response;

    await connectDB();
    const driver = await Driver.findById(access.session.user.id).select("status isActive");
    if (!driver || !driverWorks(driver.status) || driver.isActive === false) {
      return jsonError("forbidden", 403);
    }

    const bookings = await Booking.find({
      "assignedDriver._id": access.session.user.id,
      status: { $in: ["upcoming", "completed"] },
    })
      .sort({ date: 1, time: 1 })
      .select("-__v")
      .limit(500);

    return NextResponse.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Error fetching driver rides:", error);
    return jsonError("internal_error", 500);
  }
}
