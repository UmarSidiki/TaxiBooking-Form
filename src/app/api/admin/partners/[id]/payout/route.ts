import { NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Partner } from "@/features/partners/model";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";
import { getPartnerDispatchSettings } from "@/features/partners/lib/get-partner-dispatch-settings";
import { recordPartnerSettlement } from "@/features/partners/lib/record-partner-settlement";

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

    const amount = partner.payoutBalance ?? 0;
    if (!(amount > 0)) {
      return NextResponse.json({ success: true, partner }, { status: 200 });
    }

    const { currency } = await getPartnerDispatchSettings();
    await recordPartnerSettlement({
      partnerId: id,
      type: "payout_paid",
      amount,
      currency,
      createdBy: access.session.user.id,
      note: "Marked payout as paid",
      balanceInc: { payoutBalance: -amount },
      extraSet: { lastPayoutAt: new Date() },
    });

    const refreshed = await Partner.findById(id);
    return NextResponse.json(
      { success: true, partner: refreshed },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error clearing partner payout balance:", error);
    return jsonError("internal_error", 500);
  }
}
