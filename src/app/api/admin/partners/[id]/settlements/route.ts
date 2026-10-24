import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Partner } from "@/features/partners/model";
import { listPartnerStatement } from "@/features/partners/lib/list-partner-statement";
import { readPartnerBalance } from "@/features/partners/lib/partner-share-delta";
import { settlePartner } from "@/features/partners/lib/settle-partner";
import { omitPartnerDocumentFileData } from "@/features/partners/lib/to-admin-partner";
import { partnerSettlementSchema } from "@/features/partners/schema/partner-settlement.schema";
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

    const partner = await Partner.findById(id).select("balance payoutBalance remittanceBalance");
    if (!partner) return jsonError("not_found", 404);

    const entries = await listPartnerStatement(id);
    return NextResponse.json(
      { success: true, entries, balance: readPartnerBalance(partner) },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching partner settlement ledger:", error);
    return jsonError("internal_error", 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;
    const parsed = partnerSettlementSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError("invalid_body", 400);

    const { id } = await params;
    await connectDB();
    const result = await settlePartner(id, parsed.data, access.session.user.id);
    if (!result.ok) return jsonError("not_found", result.status);
    return NextResponse.json({
      success: true,
      balance: result.balance,
      partner: result.partner ? omitPartnerDocumentFileData(result.partner) : null,
    });
  } catch (error) {
    console.error("Error recording partner settlement:", error);
    return jsonError("internal_error", 500);
  }
}
