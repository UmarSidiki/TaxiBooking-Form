import { NextResponse } from "next/server";

import { requireAdmin } from "@/features/auth/lib/require-role";
import { customerExists } from "@/features/customers-admin/lib/customer-profile/customer-profile.repo";
import { listAdminAudit } from "@/features/customers-admin/lib/audit/list-admin-audit";
import { customerProfileParamSchema } from "@/features/customers-admin/schema/customer-profile.schema";
import { adminActivityQuerySchema } from "@/features/customers-admin/schema/admin-audit.schema";
import { jsonError } from "@/shared/http/json-error";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id } = await params;
    const email = customerProfileParamSchema.safeParse(id);
    if (!email.success) return jsonError("invalid_query", 400);

    const url = new URL(request.url);
    const query = adminActivityQuerySchema.safeParse({
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });
    if (!query.success) return jsonError("invalid_query", 400);
    if (!(await customerExists(email.data))) return jsonError("not_found", 404);

    const page = await listAdminAudit({
      targetType: "customer",
      targetId: email.data,
      cursor: query.data.cursor,
      limit: query.data.limit,
    });
    if (!page.ok) return jsonError(page.error, 400);

    return NextResponse.json({
      success: true,
      rows: page.rows,
      nextCursor: page.nextCursor,
    });
  } catch (error) {
    console.error("Admin customer activity failed:", error);
    return jsonError("internal_error", 500);
  }
}
