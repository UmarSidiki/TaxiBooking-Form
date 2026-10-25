import { NextResponse } from "next/server";
import { jsonError } from "@/shared/http/json-error";
import {
  qaWhatsAppMockEnabled,
  readWhatsAppOutbox,
} from "@/features/settings/lib/whatsapp-outbox";

export async function GET() {
  if (!qaWhatsAppMockEnabled()) return jsonError("not_found", 404);
  return NextResponse.json({ success: true, messages: readWhatsAppOutbox() });
}
