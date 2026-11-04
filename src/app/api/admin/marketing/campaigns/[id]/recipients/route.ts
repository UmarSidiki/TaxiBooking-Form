import { NextResponse } from "next/server";
import { z } from "zod";

import { requireMarketingAdmin } from "@/features/marketing/lib/marketing-module";
import { jsonError } from "@/shared/http/json-error";
import { isObjectIdString } from "@/features/customers-admin/lib/object-id";
import {
  RECIPIENT_BUCKETS,
  RECIPIENT_PAGE_MAX,
  listRecipientPage,
} from "@/features/marketing/lib/campaigns/campaign-report-summary";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const querySchema = z.object({
  status: z.enum(["all", ...RECIPIENT_BUCKETS]).default("all"),
  cursor: z.string().trim().max(64).optional(),
  limit: z.coerce.number().int().min(1).max(RECIPIENT_PAGE_MAX).default(50),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireMarketingAdmin();
    if (!access.ok) return access.response;

    const { id } = await context.params;
    if (!isObjectIdString(id)) return jsonError("not_found", 404);
    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      status: url.searchParams.get("status") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });
    if (!parsed.success) return jsonError("invalid_query", 400);

    const page = await listRecipientPage(id, {
      bucket: parsed.data.status,
      cursor: parsed.data.cursor,
      limit: parsed.data.limit,
    });
    return NextResponse.json({
      success: true,
      recipients: page.rows,
      nextCursor: page.nextCursor,
    });
  } catch (error) {
    console.error("Marketing campaign recipients failed:", error);
    return jsonError("internal_error", 500);
  }
}
