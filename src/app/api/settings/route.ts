import { NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Setting, type ISetting } from "@/features/settings/model";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { settingsWriteSchema } from "@/features/settings/schema/settings-write.schema";
import { toPublicSettings } from "@/features/settings/lib/public-settings";

export async function GET(request: Request) {
  await connectDB();
  try {
    // Not .lean(): hydrated documents get schema defaults applied, so a field
    // added to the schema after this document was created still reads as its
    // default rather than undefined.
    const existing = await Setting.findOne();
    const settings = existing
      ? (existing.toObject() as ISetting)
      : ((await Setting.create({})).toObject() as ISetting);

    const wantsFullScope =
      new URL(request.url).searchParams.get("scope") === "full";

    if (!wantsFullScope) {
      return NextResponse.json({
        success: true,
        data: toPublicSettings(settings),
      });
    }

    const access = await requireAdmin();
    if (!access.ok) return access.response;

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
