import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Partner } from "@/features/partners/model";
import { requireRole } from "@/features/auth/lib/require-role";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { partnerBillingSchema } from "@/features/partners/schema/partner-write.schema";

function clip(value: string | undefined, limit: number) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, limit);
}

export async function GET() {
  try {
    const access = await requireRole("partner");
    if (!access.ok) return access.response;

    await connectDB();
    const partner = await Partner.findById(access.session.user.id).select(
      "-password"
    );
    if (!partner) return jsonError("not_found", 404);

    return NextResponse.json({
      success: true,
      billingDetails: partner.billingDetails || {},
      payoutBalance: partner.payoutBalance || 0,
      lastPayoutAt: partner.lastPayoutAt || null,
    });
  } catch (error) {
    console.error("Billing GET failed:", error);
    return jsonError("internal_error", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const access = await requireRole("partner");
    if (!access.ok) return access.response;

    const parsed = await parseJsonBody(request, partnerBillingSchema);
    if (!parsed.ok) return parsed.response;

    await connectDB();
    const normalizedBilling = {
      accountHolder: clip(parsed.data.accountHolder, 120),
      bankName: clip(parsed.data.bankName, 120),
      accountNumber: clip(parsed.data.accountNumber, 60),
      iban: clip(parsed.data.iban, 64),
      swift: clip(parsed.data.swift, 60),
      notes: clip(parsed.data.notes, 500),
    };

    const updatedPartner = await Partner.findByIdAndUpdate(
      access.session.user.id,
      { $set: { billingDetails: normalizedBilling } },
      { returnDocument: "after", runValidators: true, select: "-password" }
    );
    if (!updatedPartner) return jsonError("not_found", 404);

    return NextResponse.json({
      success: true,
      billingDetails: updatedPartner.billingDetails || {},
      payoutBalance: updatedPartner.payoutBalance || 0,
      lastPayoutAt: updatedPartner.lastPayoutAt || null,
    });
  } catch (error) {
    console.error("Billing PATCH failed:", error);
    return jsonError("internal_error", 500);
  }
}
