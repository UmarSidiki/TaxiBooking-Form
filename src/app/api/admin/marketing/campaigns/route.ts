import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/auth/lib/require-role";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import {
  createCampaign,
  listCampaigns,
} from "@/features/marketing/lib/campaigns/campaign.repo";
import { campaignWriteSchema } from "@/features/marketing/schema/campaign.schema";
import { recordAdminAudit } from "@/features/customers-admin/lib/audit/record-admin-audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? undefined;
    const channel = url.searchParams.get("channel") ?? undefined;
    const campaigns = await listCampaigns({
      status,
      channel: channel as "email" | "whatsapp" | undefined,
    });
    return NextResponse.json({ success: true, campaigns });
  } catch (error) {
    console.error("Marketing campaigns list failed:", error);
    return jsonError("internal_error", 500);
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const parsed = await parseJsonBody(request, campaignWriteSchema);
    if (!parsed.ok) return parsed.response;

    const campaign = await createCampaign({
      ...parsed.data,
      createdBy: access.session.user.email ?? access.session.user.id,
    });

    await recordAdminAudit({
      actor: {
        id: access.session.user.id,
        email: access.session.user.email,
        role: access.session.user.role,
      },
      action: "campaign.create",
      targetType: "campaign",
      targetId: campaign.id,
      metadata: { name: campaign.name, channel: campaign.channel },
      request,
    });

    return NextResponse.json({ success: true, campaign }, { status: 201 });
  } catch (error) {
    console.error("Marketing campaign create failed:", error);
    return jsonError("internal_error", 500);
  }
}