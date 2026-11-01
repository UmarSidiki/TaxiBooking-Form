import { NextResponse } from "next/server";

import { connectDB } from "@/shared/db";
import { isTrackingEnabled, recordTrackingEvent } from "@/features/marketing/lib/tracking/record-tracking-event";
import { readTrackingToken } from "@/features/marketing/lib/tracking/tracking-token";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function safeUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("t");
    let campaignId = url.searchParams.get("c");
    let recipientId = url.searchParams.get("r");
    let target = safeUrl(url.searchParams.get("u"));

    const parsed = token ? readTrackingToken(token) : null;
    if (parsed && parsed.type === "click") {
      campaignId = parsed.campaignId;
      recipientId = parsed.recipientId;
      if (parsed.url) target = safeUrl(parsed.url);
    }

    if (target && campaignId && (await isTrackingEnabled("click"))) {
      await connectDB();
      await recordTrackingEvent({
        campaignId,
        recipientId,
        type: "click",
        url: target,
      });
    }

    if (!target) {
      return NextResponse.json({ success: false, error: "invalid_url" }, { status: 400 });
    }
    return NextResponse.redirect(target, 302);
  } catch (error) {
    console.error("Marketing click track failed:", error);
    return NextResponse.json({ success: false, error: "internal_error" }, { status: 500 });
  }
}