import { NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Partner } from "@/features/partners/model";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id } = await params;
    await connectDB();

    const partner = await Partner.findById(id);

    if (!partner) return jsonError("not_found", 404);

    partner.payoutBalance = 0;
    partner.lastPayoutAt = new Date();
    await partner.save();

    return NextResponse.json(
      {
        success: true,
        partner,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error clearing partner payout balance:", error);
    return jsonError("internal_error", 500);
  }
}
