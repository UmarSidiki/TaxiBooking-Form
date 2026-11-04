import { NextResponse } from "next/server";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { revokeAllCustomerSessions } from "@/features/customers/lib/customer-session";
import { customerExists } from "@/features/customers-admin/lib/customer-profile/customer-profile.repo";
import { recordAdminAudit } from "@/features/customers-admin/lib/audit/record-admin-audit";
import { customerProfileParamSchema } from "@/features/customers-admin/schema/customer-profile.schema";
import { jsonError } from "@/shared/http/json-error";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id } = await params;
    const parsed = customerProfileParamSchema.safeParse(id);
    if (!parsed.success) return jsonError("invalid_query", 400);
    if (!(await customerExists(parsed.data))) return jsonError("not_found", 404);

    const revoked = await revokeAllCustomerSessions(parsed.data);
    await recordAdminAudit({
      actor: access.session.user,
      action: "customer.sessions.revoke_all",
      targetType: "customer",
      targetId: parsed.data,
      metadata: { revoked },
      request,
    });

    return NextResponse.json({ success: true, revoked });
  } catch (error) {
    console.error("Admin revoke-all sessions failed:", error);
    return jsonError("internal_error", 500);
  }
}
