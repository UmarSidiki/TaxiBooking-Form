import { NextResponse } from "next/server";

import { requireMarketingAdmin } from "@/features/marketing/lib/marketing-module";
import { jsonError } from "@/shared/http/json-error";
import { attributeBookingToCampaign } from "@/features/marketing/lib/attribution/attribute-booking";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireMarketingAdmin();
    if (!access.ok) return access.response;

    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const result = await attributeBookingToCampaign({ ...(body as object), campaignId: id });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Marketing campaign attribute failed:", error);
    return jsonError("internal_error", 500);
  }
}