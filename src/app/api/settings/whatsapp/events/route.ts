import { NextResponse } from "next/server";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { loadWhatsAppRegistry } from "@/features/settings/lib/whatsapp-registry";
import { updateWhatsAppEvent } from "@/features/settings/lib/whatsapp-registry-actions";
import { whatsappEventActionSchema } from "@/features/settings/schema/whatsapp.schema";
import { jsonError } from "@/shared/http/json-error";
import { parseJsonBody } from "@/shared/http/parse-json-body";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await requireAdmin();
  if (!access.ok) return access.response;
  try {
    const data = await loadWhatsAppRegistry();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("WhatsApp registry GET failed:", error);
    return jsonError("internal_error", 500);
  }
}

export async function PATCH(request: Request) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;
  const parsed = await parseJsonBody(request, whatsappEventActionSchema);
  if (!parsed.ok) return parsed.response;
  try {
    const result = await updateWhatsAppEvent(parsed.data);
    if (!result.ok) return jsonError(result.error, 400);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("WhatsApp registry PATCH failed:", error);
    return jsonError("internal_error", 500);
  }
}
