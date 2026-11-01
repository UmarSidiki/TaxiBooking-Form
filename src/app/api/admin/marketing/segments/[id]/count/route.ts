import { NextResponse } from "next/server";
import { z } from "zod";

import { requireMarketingAdmin } from "@/features/marketing/lib/marketing-module";
import { jsonError } from "@/shared/http/json-error";
import { isObjectIdString } from "@/features/customers-admin/lib/object-id";
import { getSegment } from "@/features/marketing/lib/segments/segment.repo";
import { countSegmentMembers } from "@/features/marketing/lib/segments/count-segment";
import { marketingChannelSchema } from "@/features/marketing/schema/marketing.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const querySchema = z.object({ channel: marketingChannelSchema });

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const access = await requireMarketingAdmin();
    if (!access.ok) return access.response;

    const { id } = await context.params;
    if (!isObjectIdString(id)) return jsonError("not_found", 404);

    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      channel: url.searchParams.get("channel"),
    });
    if (!parsed.success) return jsonError("invalid_query", 400);

    const segment = await getSegment(id);
    if (!segment) return jsonError("not_found", 404);

    const count = await countSegmentMembers(segment.filter, parsed.data.channel);
    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error("Marketing segment count failed:", error);
    return jsonError("internal_error", 500);
  }
}
