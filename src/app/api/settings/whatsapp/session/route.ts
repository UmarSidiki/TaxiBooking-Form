import { NextResponse } from "next/server";
import { requireAdmin } from "@/features/auth/lib/require-role";
import {
  currentWhatsAppLink,
  startWhatsAppPairing,
  unlinkWhatsApp,
} from "@/features/settings/lib/whatsapp-session";
import { jsonError } from "@/shared/http/json-error";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await requireAdmin();
  if (!access.ok) return access.response;
  try {
    const data = await currentWhatsAppLink();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("WhatsApp session GET failed:", error);
    return jsonError("internal_error", 500);
  }
}

export async function POST() {
  const access = await requireAdmin();
  if (!access.ok) return access.response;
  try {
    const data = startWhatsAppPairing();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("WhatsApp session POST failed:", error);
    return jsonError("internal_error", 500);
  }
}

export async function DELETE() {
  const access = await requireAdmin();
  if (!access.ok) return access.response;
  try {
    await unlinkWhatsApp();
    return NextResponse.json({ success: true, data: { status: "needs_scan", qrDataUrl: null } });
  } catch (error) {
    console.error("WhatsApp session DELETE failed:", error);
    return jsonError("internal_error", 500);
  }
}
