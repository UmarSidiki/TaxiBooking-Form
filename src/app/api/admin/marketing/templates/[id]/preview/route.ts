import { NextResponse } from "next/server";
import { z } from "zod";

import { requireMarketingAdmin } from "@/features/marketing/lib/marketing-module";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { isObjectIdString } from "@/features/customers-admin/lib/object-id";
import { CUSTOMER_LOCALES } from "@/features/customers-admin/schema/customer-list.schema";
import { previewCampaignTemplate } from "@/features/marketing/lib/templates/preview-campaign-template";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const previewBodySchema = z.object({
  segmentId: z.string().trim().min(1).max(64),
  email: z.string().trim().max(320).optional(),
  locale: z.enum(CUSTOMER_LOCALES).optional(),
});

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const access = await requireMarketingAdmin();
    if (!access.ok) return access.response;

    const { id } = await context.params;
    if (!isObjectIdString(id)) return jsonError("not_found", 404);

    const parsed = await parseJsonBody(request, previewBodySchema);
    if (!parsed.ok) return parsed.response;

    const result = await previewCampaignTemplate({
      templateId: id,
      segmentId: parsed.data.segmentId,
      email: parsed.data.email,
      locale: parsed.data.locale,
    });
    if (!result.ok) {
      const status = result.error === "template_not_found" ? 404 : 400;
      return jsonError(result.error, status);
    }
    return NextResponse.json({ success: true, preview: result.preview });
  } catch (error) {
    console.error("Campaign template preview failed:", error);
    return jsonError("internal_error", 500);
  }
}
