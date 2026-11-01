import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";
import { getCampaignReport } from "@/features/marketing/lib/campaigns/campaign.repo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id } = await context.params;
    const report = await getCampaignReport(id);
    if (!report) return jsonError("not_found", 404);
    return NextResponse.json({ success: true, ...report });
  } catch (error) {
    console.error("Marketing campaign report failed:", error);
    return jsonError("internal_error", 500);
  }
}