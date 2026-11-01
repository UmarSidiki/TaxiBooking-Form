import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/features/auth/lib/require-role";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { isObjectIdString } from "@/features/customers-admin/lib/object-id";
import { CUSTOMER_LOCALES } from "@/features/customers-admin/schema/customer-list.schema";
import { sendTestMessage } from "@/features/marketing/lib/test-send/send-test-message";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const testSendBodySchema = z.object({
  recipient: z.string().trim().min(3).max(254),
  locale: z.enum(CUSTOMER_LOCALES).optional(),
});

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id } = await context.params;
    if (!isObjectIdString(id)) return jsonError("not_found", 404);

    const parsed = await parseJsonBody(request, testSendBodySchema);
    if (!parsed.ok) return parsed.response;

    const result = await sendTestMessage({
      templateId: id,
      recipient: parsed.data.recipient,
      locale: parsed.data.locale,
    });
    if (!result.ok) {
      const status = result.error === "template_not_found" ? 404 : 400;
      return jsonError(result.error, status);
    }
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Campaign template test send failed:", error);
    return jsonError("internal_error", 500);
  }
}
