import { NextResponse } from "next/server";

import { requireMarketingAdmin } from "@/features/marketing/lib/marketing-module";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import {
  createCampaignTemplate,
  listCampaignTemplates,
} from "@/features/marketing/lib/templates/campaign-template.repo";
import { campaignTemplateWriteSchema } from "@/features/marketing/schema/campaign-template.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const access = await requireMarketingAdmin();
    if (!access.ok) return access.response;

    const templates = await listCampaignTemplates();
    return NextResponse.json({ success: true, templates });
  } catch (error) {
    console.error("Campaign templates list failed:", error);
    return jsonError("internal_error", 500);
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireMarketingAdmin();
    if (!access.ok) return access.response;

    const parsed = await parseJsonBody(request, campaignTemplateWriteSchema);
    if (!parsed.ok) return parsed.response;

    const template = await createCampaignTemplate({
      ...parsed.data,
      createdBy: access.session.user.email ?? access.session.user.id,
    });
    return NextResponse.json({ success: true, template }, { status: 201 });
  } catch (error) {
    console.error("Campaign template create failed:", error);
    return jsonError("internal_error", 500);
  }
}
