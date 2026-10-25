import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/shared/db";
import { Setting } from "@/features/settings/model";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

const flag = z.boolean();
const schema = z.object({
  whatsappTplAssigned: flag,
  whatsappTplAvailable: flag,
  whatsappTplChanged: flag,
  whatsappTplReminder: flag,
  whatsappTplSettlement: flag,
});

const KEYS = [
  "whatsappTplAssigned",
  "whatsappTplAvailable",
  "whatsappTplChanged",
  "whatsappTplReminder",
  "whatsappTplSettlement",
] as const;

export async function GET() {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;
    await connectDB();
    const settings = await Setting.findOne().select(KEYS.join(" ")).lean();
    const flags = Object.fromEntries(KEYS.map((key) => [key, Boolean(settings?.[key])]));
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
    await connectDB();
    await Setting.updateOne({}, { $set: parsed.data }, { upsert: true });
    return NextResponse.json({ success: true, flags: parsed.data });
  } catch (error) {
    console.error("WhatsApp notify save failed:", error);
    return jsonError("internal_error", 500);
  }
}
