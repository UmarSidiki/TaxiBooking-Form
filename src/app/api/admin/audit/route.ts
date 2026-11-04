import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/auth/lib/require-role";
import { listAdminAudit } from "@/features/customers-admin/lib/audit/list-admin-audit";
import {
  adminAuditQuerySchema,
  auditDateRange,
} from "@/features/customers-admin/schema/admin-audit.schema";
import { jsonError } from "@/shared/http/json-error";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function toQueryObject(searchParams: URLSearchParams): Record<string, string> {
  const query: Record<string, string> = {};
  for (const [key, value] of searchParams) {
    if (value !== "") query[key] = value;
  }
  return query;
}

export async function GET(request: Request) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const url = new URL(request.url);
    const parsed = adminAuditQuerySchema.safeParse(
      toQueryObject(url.searchParams),
    );
    if (!parsed.success) return jsonError("invalid_query", 400);

    const range = auditDateRange(parsed.data);
    const page = await listAdminAudit({
      action: parsed.data.action === "any" ? undefined : parsed.data.action,
      targetId: parsed.data.target || undefined,
      actorPrefix: parsed.data.actor || undefined,
      from: range.from,
      to: range.to,
      cursor: parsed.data.cursor,
      limit: parsed.data.limit,
    });
    if (!page.ok) return jsonError(page.error, 400);

    return NextResponse.json({
      success: true,
      rows: page.rows,
      nextCursor: page.nextCursor,
    });
  } catch (error) {
    console.error("Admin audit log list failed:", error);
    return jsonError("internal_error", 500);
  }
}
