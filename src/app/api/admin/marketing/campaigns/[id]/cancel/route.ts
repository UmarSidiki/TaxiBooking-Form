import { NextResponse } from "next/server";

import { requireMarketingAdmin } from "@/features/marketing/lib/marketing-module";
import { jsonError } from "@/shared/http/json-error";
import { cancelCampaign } from "@/features/marketing/lib/campaigns/campaign.repo";
import { recordAdminAudit } from "@/features/customers-admin/lib/audit/record-admin-audit";

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
    const campaign = await cancelCampaign(id);
    if (!campaign) return jsonError("not_found", 404);

    await recordAdminAudit({
      actor: { id: access.session.user.id, email: access.session.user.email, role: access.session.user.role },
      action: "campaign.cancel",
      targetType: "campaign",
      targetId: id,
      metadata: { action: "cancel" },
      request,
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    console.error("Marketing campaign cancel failed:", error);
    return jsonError("internal_error", 500);
  }
}