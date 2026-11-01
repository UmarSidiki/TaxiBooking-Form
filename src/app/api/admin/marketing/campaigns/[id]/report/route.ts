import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";
import { getCampaign } from "@/features/marketing/lib/campaigns/campaign.repo";
import {
  buildCampaignReportSummary,
  listRecipientPage,
} from "@/features/marketing/lib/campaigns/campaign-report-summary";

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
    const campaign = await getCampaign(id);
    if (!campaign) return jsonError("not_found", 404);
    const [summary, page] = await Promise.all([
      buildCampaignReportSummary(campaign),
      listRecipientPage(id, { limit: 50 }),
    ]);
    return NextResponse.json({
      success: true,
      campaign,
      summary,
      recipients: page.rows,
      nextCursor: page.nextCursor,
    });
  } catch (error) {
    console.error("Marketing campaign report failed:", error);
    return jsonError("internal_error", 500);
  }
}