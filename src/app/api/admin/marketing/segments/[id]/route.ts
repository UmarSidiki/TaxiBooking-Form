import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/auth/lib/require-role";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { isObjectIdString } from "@/features/customers-admin/lib/object-id";
import {
  deleteSegment,
  getSegment,
  updateSegment,
} from "@/features/marketing/lib/segments/segment.repo";
import { segmentUpdateSchema } from "@/features/marketing/schema/segment.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id } = await context.params;
    if (!isObjectIdString(id)) return jsonError("not_found", 404);

    const segment = await getSegment(id);
    if (!segment) return jsonError("not_found", 404);
    return NextResponse.json({ success: true, segment });
  } catch (error) {
    console.error("Marketing segment read failed:", error);
    return jsonError("internal_error", 500);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id } = await context.params;
    if (!isObjectIdString(id)) return jsonError("not_found", 404);

    const parsed = await parseJsonBody(request, segmentUpdateSchema);
    if (!parsed.ok) return parsed.response;

    const segment = await updateSegment(id, parsed.data);
    if (!segment) return jsonError("not_found", 404);
    return NextResponse.json({ success: true, segment });
  } catch (error) {
    console.error("Marketing segment update failed:", error);
    return jsonError("internal_error", 500);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id } = await context.params;
    if (!isObjectIdString(id)) return jsonError("not_found", 404);

    const deleted = await deleteSegment(id);
    if (!deleted) return jsonError("not_found", 404);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Marketing segment delete failed:", error);
    return jsonError("internal_error", 500);
  }
}
