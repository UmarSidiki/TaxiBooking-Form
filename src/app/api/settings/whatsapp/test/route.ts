import { NextResponse } from "next/server";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { sendWhatsAppTest } from "@/features/settings/lib/whatsapp-desk";
import { whatsappTestSendSchema } from "@/features/settings/schema/whatsapp.schema";
import { jsonError } from "@/shared/http/json-error";
import { parseJsonBody } from "@/shared/http/parse-json-body";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;
  const parsed = await parseJsonBody(request, whatsappTestSendSchema);
  if (!parsed.ok) return parsed.response;
  try {
    const result = await sendWhatsAppTest(parsed.data.templateId, parsed.data.to);
    if (!result.ok) {
      const status = result.error === "not_found" ? 404 : 400;
      return jsonError(result.error, status);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("WhatsApp test send failed:", error);
    return jsonError("internal_error", 500);
  }
}
