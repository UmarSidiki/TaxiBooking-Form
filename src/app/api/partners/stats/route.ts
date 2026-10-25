import { NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { computePartnerRideStats } from "@/features/partners/lib/compute-partner-ride-stats";
import { requireRole } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

export async function GET() {
  try {
    const access = await requireRole("partner");
    if (!access.ok) return access.response;

    await connectDB();
    const stats = await computePartnerRideStats(access.session.user.id);

    return NextResponse.json({ success: true, stats }, { status: 200 });
  } catch (error) {
    console.error("Error fetching partner stats:", error);
    return jsonError("internal_error", 500);
  }
}
