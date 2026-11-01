import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/auth/lib/require-role";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import {
  createSegment,
  listSegments,
} from "@/features/marketing/lib/segments/segment.repo";
import { segmentWriteSchema } from "@/features/marketing/schema/segment.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const segments = await listSegments();
    return NextResponse.json({ success: true, segments });
  } catch (error) {
    console.error("Marketing segments list failed:", error);
    return jsonError("internal_error", 500);
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const parsed = await parseJsonBody(request, segmentWriteSchema);
    if (!parsed.ok) return parsed.response;

    const segment = await createSegment({
      name: parsed.data.name,
      filter: parsed.data.filter,
      createdBy: access.session.user.email ?? access.session.user.id,
    });
    return NextResponse.json({ success: true, segment }, { status: 201 });
  } catch (error) {
    console.error("Marketing segment create failed:", error);
    return jsonError("internal_error", 500);
  }
}
