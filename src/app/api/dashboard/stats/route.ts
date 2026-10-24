import { NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Setting } from "@/features/settings/model";
import { aggregateDashboardStats } from "@/features/dashboard/lib/aggregate-dashboard-stats";
import { DEFAULT_BOOKING_TIMEZONE } from "@/features/rides/lib/ride-constants";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

export async function GET() {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    await connectDB();
    const setting = await Setting.findOne().select("timezone").lean();
    const data = await aggregateDashboardStats(
      new Date(),
      setting?.timezone || DEFAULT_BOOKING_TIMEZONE,
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return jsonError("internal_error", 500);
  }
}
