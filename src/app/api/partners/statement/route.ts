import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Partner } from "@/features/partners/model";
import { listPartnerStatement } from "@/features/partners/lib/list-partner-statement";
import { readPartnerBalance } from "@/features/partners/lib/partner-share-delta";
import { renderPartnerStatementPdf } from "@/features/partners/lib/render-partner-statement-pdf";
import { requireRole } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

export async function GET(request: NextRequest) {
  try {
    const access = await requireRole("partner");
    if (!access.ok) return access.response;

    const month = request.nextUrl.searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) return jsonError("invalid_body", 400);

    await connectDB();
    const partner = await Partner.findById(access.session.user.id).select("name balance payoutBalance remittanceBalance");
    if (!partner) return jsonError("not_found", 404);

    const lines = await listPartnerStatement(String(partner._id), month);
    const pdf = await renderPartnerStatementPdf({
      partnerName: partner.name,
      month,
      currencySymbol: "€",
      lines,
      closingBalance: lines.at(-1)?.runningBalance ?? readPartnerBalance(partner),
    });

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="statement-${month}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Partner statement failed:", error);
    return jsonError("internal_error", 500);
  }
}
