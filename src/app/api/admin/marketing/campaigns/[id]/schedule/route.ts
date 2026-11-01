import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/auth/lib/require-role";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import {
  getCampaign,
  scheduleCampaign,
} from "@/features/marketing/lib/campaigns/campaign.repo";
import { materialiseCampaignRecipients } from "@/features/marketing/lib/campaigns/materialise-recipients";
import { getSegment } from "@/features/marketing/lib/segments/segment.repo";
import { countSegmentMembers } from "@/features/marketing/lib/segments/count-segment";
import { isMissingSendConfirmation } from "@/features/marketing/lib/campaigns/requires-confirmation";
import { campaignScheduleSchema } from "@/features/marketing/schema/campaign.schema";
import { recordAdminAudit } from "@/features/customers-admin/lib/audit/record-admin-audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id } = await context.params;
    const parsed = await parseJsonBody(request, campaignScheduleSchema);
    if (!parsed.ok) return parsed.response;

    const campaign = await getCampaign(id);
    if (!campaign) return jsonError("not_found", 404);

    // Large sends need the typed confirmation, checked here and not only in the UI.
    if (parsed.data.scheduledAt && campaign.segmentId) {
      const segment = await getSegment(campaign.segmentId);
      if (segment) {
        const count = await countSegmentMembers(segment.filter, campaign.channel);
        if (isMissingSendConfirmation(count.eligible, parsed.data.confirmationText)) {
          return jsonError("confirmation_required", 400);
        }
      }
    }

    const scheduledAt = parsed.data.scheduledAt
      ? new Date(parsed.data.scheduledAt)
      : null;

    // Materialise recipients if not already done
    const updated = await scheduleCampaign(id, scheduledAt);
    if (!updated) return jsonError("not_found", 404);

    try {
      await materialiseCampaignRecipients(id);
    } catch {
      // ignore
    }

    await recordAdminAudit({
      actor: {
        id: access.session.user.id,
        email: access.session.user.email,
        role: access.session.user.role,
      },
      action: "campaign.schedule",
      targetType: "campaign",
      targetId: id,
      metadata: { scheduledAt: scheduledAt?.toISOString() ?? null },
      request,
    });

    return NextResponse.json({ success: true, campaign: updated });
  } catch (error) {
    console.error("Marketing campaign schedule failed:", error);
    return jsonError("internal_error", 500);
  }
}