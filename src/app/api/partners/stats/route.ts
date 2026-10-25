import { NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { computePartnerRideStats } from "@/features/partners/lib/compute-partner-ride-stats";
import { Partner } from "@/features/partners/model";
import { readPartnerBalance } from "@/features/partners/lib/partner-share-delta";
import { requireRole } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

export async function GET() {
  try {
    const access = await requireRole("partner");
    if (!access.ok) return access.response;

    await connectDB();
    const [stats, partner] = await Promise.all([
      computePartnerRideStats(access.session.user.id),
      Partner.findById(access.session.user.id).select("balance payoutBalance remittanceBalance"),
    ]);

    return NextResponse.json(
      { success: true, stats: { ...stats, balance: readPartnerBalance(partner) } },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching partner stats:", error);
    return jsonError("internal_error", 500);
  }
}
