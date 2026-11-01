import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/auth/lib/require-role";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import {
  getCampaign,
  updateCampaign,
  deleteCampaign,
} from "@/features/marketing/lib/campaigns/campaign.repo";
import { campaignUpdateSchema } from "@/features/marketing/schema/campaign.schema";

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
    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    console.error("Marketing campaign get failed:", error);
    return jsonError("internal_error", 500);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id } = await context.params;
    const parsed = await parseJsonBody(request, campaignUpdateSchema);
    if (!parsed.ok) return parsed.response;

    const campaign = await updateCampaign(id, parsed.data);
    if (!campaign) return jsonError("not_found", 404);
    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    console.error("Marketing campaign update failed:", error);
    return jsonError("internal_error", 500);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id } = await context.params;
    const ok = await deleteCampaign(id);
    if (!ok) return jsonError("not_found", 404);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Marketing campaign delete failed:", error);
    return jsonError("internal_error", 500);
  }
}