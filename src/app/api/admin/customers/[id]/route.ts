import { NextResponse } from "next/server";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { loadCustomerProfile } from "@/features/customers-admin/lib/customer-profile/load-customer-profile";
import { customerProfileParamSchema } from "@/features/customers-admin/schema/customer-profile.schema";
import { jsonError } from "@/shared/http/json-error";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id } = await params;
    const parsed = customerProfileParamSchema.safeParse(id);
    if (!parsed.success) return jsonError("invalid_query", 400);

    const profile = await loadCustomerProfile(parsed.data);
    if (!profile) return jsonError("not_found", 404);

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error("Admin customer profile failed:", error);
    return jsonError("internal_error", 500);
  }
}
