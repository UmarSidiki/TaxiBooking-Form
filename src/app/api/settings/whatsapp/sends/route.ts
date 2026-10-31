import { NextResponse } from "next/server";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { listRecentWhatsAppSends } from "@/features/settings/lib/whatsapp-send-log";
import { jsonError } from "@/shared/http/json-error";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await requireAdmin();
  if (!access.ok) return access.response;
  try {
    const sends = await listRecentWhatsAppSends(50);
    return NextResponse.json({ success: true, data: { sends } });
  } catch (error) {
    console.error("WhatsApp send log GET failed:", error);
    return jsonError("internal_error", 500);
  }
}
