import { NextResponse } from "next/server";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { customerExists } from "@/features/customers-admin/lib/customer-profile/customer-profile.repo";
import { recordAdminAudit } from "@/features/customers-admin/lib/audit/record-admin-audit";
import { applyMarketingConsent } from "@/features/marketing/lib/consent/apply-marketing-consent";
import { loadMarketingSnapshot } from "@/features/marketing/lib/consent/marketing-consent.repo";
import { adminMarketingActionSchema } from "@/features/marketing/schema/marketing.schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

function emailFrom(id: string) {
  return decodeURIComponent(id).trim().toLowerCase();
}

export async function GET(_request: Request, { params }: Params) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  try {
    const email = emailFrom((await params).id);
    if (!(await customerExists(email))) return jsonError("not_found", 404);
    return NextResponse.json({
      success: true,
      data: await loadMarketingSnapshot(email),
    });
  } catch (error) {
    console.error("Admin marketing snapshot failed:", error);
    return jsonError("internal_error", 500);
  }
}

export async function POST(request: Request, { params }: Params) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  try {
    const email = emailFrom((await params).id);
    if (!(await customerExists(email))) return jsonError("not_found", 404);

    const parsed = await parseJsonBody(request, adminMarketingActionSchema);
    if (!parsed.ok) return parsed.response;

    const { channel, action, reason, textVersion } = parsed.data;
    const status = action === "record_offline" ? "granted" : "withdrawn";

    await applyMarketingConsent({
      email,
      channel,
      status,
      source: "admin_offline",
      reason,
      textVersion,
      actorId: access.session.user.id,
    });

    await recordAdminAudit({
      actor: access.session.user,
      action:
        action === "record_offline"
          ? "customer.consent.record_offline"
          : "customer.consent.withdraw",
      targetType: "customer",
      targetId: email,
      metadata: {
        channel,
        status,
        source: "admin_offline",
        ...(reason ? { reason } : {}),
      },
      request,
    });

    return NextResponse.json({
      success: true,
      data: await loadMarketingSnapshot(email),
    });
  } catch (error) {
    console.error("Admin marketing action failed:", error);
    return jsonError("internal_error", 500);
  }
}
