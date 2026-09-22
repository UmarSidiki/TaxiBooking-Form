import { NextResponse } from "next/server";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { loadWhatsAppDesk, saveWhatsAppConfig } from "@/features/settings/lib/whatsapp-desk";
import { whatsappConfigWriteSchema } from "@/features/settings/schema/whatsapp.schema";
import { jsonError } from "@/shared/http/json-error";
import { parseJsonBody } from "@/shared/http/parse-json-body";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await requireAdmin();
  if (!access.ok) return access.response;
  try {
    const data = await loadWhatsAppDesk();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("WhatsApp settings GET failed:", error);
    return jsonError("internal_error", 500);
  }
}

export async function PUT(request: Request) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;
  const parsed = await parseJsonBody(request, whatsappConfigWriteSchema);
  if (!parsed.ok) return parsed.response;
  try {
    const config = await saveWhatsAppConfig(parsed.data);
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error("WhatsApp settings PUT failed:", error);
    return jsonError("internal_error", 500);
  }
}
