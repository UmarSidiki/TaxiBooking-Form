import { NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Setting } from "@/features/settings/model";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { settingsWriteSchema } from "@/features/settings/schema/settings-write.schema";

export async function GET() {
  await connectDB();
  try {
    const settings = await Setting.findOne();
    if (!settings) {
      const defaultSettings = await Setting.create({});
      return NextResponse.json({ success: true, data: defaultSettings });
    }
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("Settings GET failed:", error);
    return jsonError("internal_error", 500);
  }
}

export async function POST(request: Request) {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  await connectDB();
  try {
    const parsed = await parseJsonBody(request, settingsWriteSchema);
    if (!parsed.ok) return parsed.response;

    const existing = await Setting.findOne();
    if (existing) {
      Object.assign(existing, parsed.data);
      await existing.save();
      return NextResponse.json({ success: true, data: existing });
    }
    const newSettings = new Setting(parsed.data);
    await newSettings.save();
    return NextResponse.json({ success: true, data: newSettings });
  } catch (error) {
    console.error("Settings POST failed:", error);
    return jsonError("internal_error", 500);
  }
}
