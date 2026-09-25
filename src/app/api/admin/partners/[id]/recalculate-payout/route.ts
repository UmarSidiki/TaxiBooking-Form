import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Partner } from "@/features/partners/model";
import PartnerSettlementEntry from "@/features/partners/model/PartnerSettlementEntry";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

/** Rebuild Partner running balances from the settlement ledger. */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id } = await params;
    await connectDB();

    const partner = await Partner.findById(id);
    if (!partner) return jsonError("not_found", 404);

    const entries = await PartnerSettlementEntry.find({ partnerId: id })
      .sort({ createdAt: 1 })
      .lean();

    let totalEarnings = 0;
    let onlineEarnings = 0;
    let cashEarnings = 0;
    let payoutBalance = 0;
    let remittanceBalance = 0;

    for (const entry of entries) {
      const amount = entry.amount;
      if (!(amount > 0)) continue;

      switch (entry.type) {
        case "payout_credit":
          totalEarnings += amount;
          if (entry.channel === "cash") {
            cashEarnings += amount;
          } else {
            onlineEarnings += amount;
            payoutBalance += amount;
          }
          break;
        case "payout_paid":
          payoutBalance -= amount;
          break;
        case "remittance_credit":
          remittanceBalance += amount;
          break;
        case "remittance_received":
          remittanceBalance -= amount;
          break;
        case "clawback":
          if (/remittance_credit/i.test(entry.note ?? "")) {
            remittanceBalance -= amount;
          } else if (entry.channel === "cash") {
            totalEarnings -= amount;
            cashEarnings -= amount;
          } else {
            totalEarnings -= amount;
            onlineEarnings -= amount;
            payoutBalance -= amount;
          }
          break;
        default:
          break;
      }
    }

    const round2 = (n: number) => Math.round(n * 100) / 100;

    partner.totalEarnings = round2(Math.max(0, totalEarnings));
    partner.onlineEarnings = round2(Math.max(0, onlineEarnings));
    partner.cashEarnings = round2(Math.max(0, cashEarnings));
    partner.payoutBalance = round2(Math.max(0, payoutBalance));
    partner.remittanceBalance = round2(Math.max(0, remittanceBalance));
    await partner.save();

    return NextResponse.json(
      {
        success: true,
        partner,
        summary: {
          totalEarnings: partner.totalEarnings,
          onlineEarnings: partner.onlineEarnings,
          cashEarnings: partner.cashEarnings,
          payoutBalance: partner.payoutBalance,
          remittanceBalance: partner.remittanceBalance,
          entriesProcessed: entries.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error recalculating partner payout:", error);
    return jsonError("internal_error", 500);
  }
}
