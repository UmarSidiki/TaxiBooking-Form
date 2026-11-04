import { NextResponse } from "next/server";

import { connectDB } from "@/shared/db";
import { isTrackingEnabled, recordTrackingEvent } from "@/features/marketing/lib/tracking/record-tracking-event";
import { readTrackingToken } from "@/features/marketing/lib/tracking/tracking-token";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("t");
    const campaignId = url.searchParams.get("c");
    const recipientId = url.searchParams.get("r");

    let c = campaignId;
    let r = recipientId;
    const parsed = token ? readTrackingToken(token) : null;
    if (parsed && parsed.type === "open") {
      c = parsed.campaignId;
      r = parsed.recipientId;
    }

    if (c && (await isTrackingEnabled("open"))) {
      await connectDB();
      await recordTrackingEvent({
        campaignId: c,
        recipientId: r,
        type: "open",
      });
    }

    return new NextResponse(PIXEL, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch {
    return new NextResponse(PIXEL, {
      status: 200,
      headers: { "Content-Type": "image/gif" },
    });
  }
}