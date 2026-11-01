import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/auth/lib/require-role";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { isObjectIdString } from "@/features/customers-admin/lib/object-id";
import {
  deleteCampaignTemplate,
  getCampaignTemplate,
  updateCampaignTemplate,
} from "@/features/marketing/lib/templates/campaign-template.repo";
import { campaignTemplateWriteSchema } from "@/features/marketing/schema/campaign-template.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id } = await context.params;
    if (!isObjectIdString(id)) return jsonError("not_found", 404);

    const template = await getCampaignTemplate(id);
    if (!template) return jsonError("not_found", 404);
    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error("Campaign template read failed:", error);
    return jsonError("internal_error", 500);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id } = await context.params;
    if (!isObjectIdString(id)) return jsonError("not_found", 404);

    const parsed = await parseJsonBody(request, campaignTemplateWriteSchema);
    if (!parsed.ok) return parsed.response;

    const template = await updateCampaignTemplate(id, parsed.data);
    if (!template) return jsonError("not_found", 404);
    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error("Campaign template update failed:", error);
    return jsonError("internal_error", 500);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id } = await context.params;
    if (!isObjectIdString(id)) return jsonError("not_found", 404);

    const deleted = await deleteCampaignTemplate(id);
    if (!deleted) return jsonError("not_found", 404);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Campaign template delete failed:", error);
    return jsonError("internal_error", 500);
  }
}
