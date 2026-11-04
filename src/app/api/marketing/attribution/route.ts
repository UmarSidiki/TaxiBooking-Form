import { NextResponse } from "next/server";
import { jsonError } from "@/shared/http/json-error";
import { attributeBookingToCampaign } from "@/features/marketing/lib/attribution/attribute-booking";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await attributeBookingToCampaign(body as never);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Marketing attribution failed:", error);
    return jsonError("internal_error", 500);
  }
}