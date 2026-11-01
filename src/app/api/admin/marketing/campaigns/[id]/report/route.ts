import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";
import { getCampaignReport } from "@/features/marketing/lib/campaigns/campaign.repo";
import {
  buildCampaignReportSummary,
  toRecipientRow,
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
    const report = await getCampaignReport(id);
    if (!report || !report.campaign) return jsonError("not_found", 404);
    const summary = await buildCampaignReportSummary(report.campaign, report.recipients);
    return NextResponse.json({
      success: true,
      campaign: report.campaign,
      summary,
      recipients: report.recipients.map(toRecipientRow),
    });
  } catch (error) {
    console.error("Marketing campaign report failed:", error);
    return jsonError("internal_error", 500);
  }
}