import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";
import {
  readWhatsAppToggleFlags,
  writeWhatsAppToggleFlags,
} from "@/features/notifications/lib/legacy-whatsapp-toggles";

const flag = z.boolean();
const schema = z.object({
  whatsappTplAssigned: flag,
  whatsappTplAvailable: flag,
  whatsappTplChanged: flag,
  whatsappTplCancelled: flag,
  whatsappTplReminder: flag,
  whatsappTplSettlement: flag,
});

export async function GET() {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;
    const flags = await readWhatsAppToggleFlags();
    return NextResponse.json({ success: true, flags });
  } catch (error) {
    console.error("WhatsApp notify read failed:", error);
    return jsonError("internal_error", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError("invalid_body", 400);
    await writeWhatsAppToggleFlags(parsed.data);
    return NextResponse.json({ success: true, flags: parsed.data });
  } catch (error) {
    console.error("WhatsApp notify save failed:", error);
    return jsonError("internal_error", 500);
  }
}
