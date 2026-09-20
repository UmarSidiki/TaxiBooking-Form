import { NextRequest, NextResponse } from "next/server";
import { finalizePaidBooking } from "@/features/payments/lib/finalize-paid-booking";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { completePaymentBodySchema } from "@/features/payments/schema/checkout.schema";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request, completePaymentBodySchema);
    if (!parsed.ok) return parsed.response;

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      request.headers.get("origin") ||
      undefined;

    const result = await finalizePaidBooking({
      ...parsed.data,
      baseUrl,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "payment_failed",
          retryable: result.retryable ?? false,
        },
        { status: result.retryable ? 202 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      tripId: result.tripId,
      bookingId: result.bookingId,
      alreadyExisted: result.alreadyExisted,
      emails: result.emails,
    });
  } catch (error) {
    console.error("complete-payment error:", error);
    return jsonError("internal_error", 500);
  }
}
