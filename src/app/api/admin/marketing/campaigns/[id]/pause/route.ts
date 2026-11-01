import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";
import { pauseCampaign } from "@/features/marketing/lib/campaigns/campaign.repo";
import { recordAdminAudit } from "@/features/customers-admin/lib/audit/record-admin-audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id } = await context.params;
    const campaign = await pauseCampaign(id);
    if (!campaign) return jsonError("not_found", 404);

    await recordAdminAudit({
      actor: { id: access.session.user.id, email: access.session.user.email, role: access.session.user.role },
      action: "campaign.pause",
      targetType: "campaign",
      targetId: id,
      metadata: { action: "pause" },
      request: _request,
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    console.error("Marketing campaign pause failed:", error);
    return jsonError("internal_error", 500);
  }
}