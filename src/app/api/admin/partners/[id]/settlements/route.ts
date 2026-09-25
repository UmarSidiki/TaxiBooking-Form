import { NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Partner } from "@/features/partners/model";
import PartnerSettlementEntry from "@/features/partners/model/PartnerSettlementEntry";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id } = await params;
    await connectDB();

    const partner = await Partner.findById(id).select("_id");
    if (!partner) return jsonError("not_found", 404);

    const entries = await PartnerSettlementEntry.find({ partnerId: id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ success: true, entries }, { status: 200 });
  } catch (error) {
    console.error("Error fetching partner settlement ledger:", error);
    return jsonError("internal_error", 500);
  }
}
