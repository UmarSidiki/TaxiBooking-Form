import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { checkoutCancelBodySchema } from "@/features/payments/schema/checkout-session.schema";
import { cancelCheckoutSession } from "@/features/payments/lib/checkout/cancel-checkout-session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request, checkoutCancelBodySchema);
    if (!parsed.ok) return parsed.response;

    const result = await cancelCheckoutSession(parsed.data.draftId);
    return NextResponse.json({ success: true, cancelled: result.cancelled });
  } catch (error) {
    console.error("Error cancelling checkout session:", error);
    return jsonError("internal_error", 500);
  }
}
