import { NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Partner } from "@/features/partners/model";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";
import { settlePartner } from "@/features/partners/lib/settle-partner";
import { readPartnerBalance } from "@/features/partners/lib/partner-share-delta";
import { omitPartnerDocumentFileData } from "@/features/partners/lib/to-admin-partner";

/** Pays the full positive balance. Prefer the settle dialog for a partial amount. */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;
    const { id } = await params;
    await connectDB();
    const partner = await Partner.findById(id).select("balance payoutBalance remittanceBalance");
    if (!partner) return jsonError("not_found", 404);
    const amount = readPartnerBalance(partner);
    if (!(amount > 0)) {
      return NextResponse.json(
        { success: true, partner: omitPartnerDocumentFileData(partner), balance: amount },
        { status: 200 },
      );
    }
    const result = await settlePartner(
      id,
      { amount, direction: "pay_partner", method: "bank", note: "Balance paid" },
      access.session.user.id,
    );
    if (!result.ok || !result.partner) return jsonError("not_found", 404);
    return NextResponse.json(
      { success: true, partner: omitPartnerDocumentFileData(result.partner), balance: result.balance },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error clearing partner payout balance:", error);
    return jsonError("internal_error", 500);
  }
}
