import { NextResponse } from "next/server";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { revokeCustomerSessionById } from "@/features/customers/lib/customer-session";
import {
  customerProfileParamSchema,
  customerSessionIdParamSchema,
} from "@/features/customers-admin/schema/customer-profile.schema";
import { jsonError } from "@/shared/http/json-error";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; sessionId: string }> },
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id, sessionId } = await params;
    const email = customerProfileParamSchema.safeParse(id);
    const session = customerSessionIdParamSchema.safeParse(sessionId);
    if (!email.success || !session.success) return jsonError("invalid_query", 400);

    const revoked = await revokeCustomerSessionById(email.data, session.data);
    if (!revoked) return jsonError("not_found", 404);

    return NextResponse.json({ success: true, revoked: 1 });
  } catch (error) {
    console.error("Admin revoke session failed:", error);
    return jsonError("internal_error", 500);
  }
}
