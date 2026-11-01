import { NextResponse } from "next/server";

import { requireMarketingAdmin } from "@/features/marketing/lib/marketing-module";
import { jsonError } from "@/shared/http/json-error";
import { getMarketingOperatorSettings } from "@/features/marketing/lib/operator-settings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const access = await requireMarketingAdmin();
    if (!access.ok) return access.response;
    const operator = await getMarketingOperatorSettings();
    return NextResponse.json({ success: true, operator });
  } catch (error) {
    console.error("Marketing operator settings failed:", error);
    return jsonError("internal_error", 500);
  }
}
