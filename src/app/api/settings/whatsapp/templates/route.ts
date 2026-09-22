import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/features/auth/lib/require-role";
import {
  createWhatsAppTemplate,
  deleteWhatsAppTemplate,
  updateWhatsAppTemplate,
} from "@/features/settings/lib/whatsapp-desk";
import { whatsappTemplateWriteSchema } from "@/features/settings/schema/whatsapp.schema";
import { jsonError } from "@/shared/http/json-error";
import { parseJsonBody } from "@/shared/http/parse-json-body";

export const dynamic = "force-dynamic";

const updateSchema = whatsappTemplateWriteSchema.extend({
  id: z.string().regex(/^[a-f0-9]{24}$/),
});

export async function POST(request: Request) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;
  const parsed = await parseJsonBody(request, whatsappTemplateWriteSchema);
  if (!parsed.ok) return parsed.response;
  try {
    const template = await createWhatsAppTemplate(parsed.data);
    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    console.error("WhatsApp template POST failed:", error);
    return jsonError("internal_error", 500);
  }
}

export async function PATCH(request: Request) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;
  const parsed = await parseJsonBody(request, updateSchema);
  if (!parsed.ok) return parsed.response;
  try {
    const { id, ...input } = parsed.data;
    const template = await updateWhatsAppTemplate(id, input);
    if (!template) return jsonError("not_found", 404);
    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    console.error("WhatsApp template PATCH failed:", error);
    return jsonError("internal_error", 500);
  }
}

export async function DELETE(request: Request) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!/^[a-f0-9]{24}$/.test(id)) return jsonError("invalid_body", 400);
  try {
    await deleteWhatsAppTemplate(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("WhatsApp template DELETE failed:", error);
    return jsonError("internal_error", 500);
  }
}
