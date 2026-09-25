import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { findBookingByPaymentToken } from "@/features/booking/lib/find-booking-by-payment-token";
import { updateBookingFields } from "@/features/booking/lib/booking.repo";
import { Setting } from "@/features/settings/model";
import { resolvePublicBaseUrl } from "@/features/payments/lib/resolve-base-url";
import { jsonError } from "@/shared/http/json-error";
import { bookingMailLocale } from "@/features/booking/lib/booking-mail-url";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    await connectDB();
    const booking = await findBookingByPaymentToken(token);

    if (!booking || booking.status !== "awaiting_payment") {
      return jsonError("not_found", 404);
    }

    const amount = Number(booking.quotedAmount ?? booking.totalAmount ?? 0);
    if (!(amount > 0)) {
      return jsonError("invalid_body", 400);
    }

    const settings = await Setting.findOne();
    const apiKey = settings?.multisafepayApiKey;
    if (!apiKey) {
      return jsonError("payment_not_configured", 500);
    }

    const baseUrl = resolvePublicBaseUrl(request);
    if (!baseUrl) {
      return jsonError("payment_not_configured", 500);
    }

    const locale = bookingMailLocale(booking.locale);
    const orderId = `${booking.tripId}-q${Date.now().toString(36)}`;
    const currency = (settings?.stripeCurrency || "EUR").toUpperCase();
    const apiUrl = settings?.multisafepayTestMode
      ? "https://testapi.multisafepay.com/v1/json/orders"
      : "https://api.multisafepay.com/v1/json/orders";

    const orderPayload = {
      type: "redirect",
      order_id: orderId,
      currency,
      amount: Math.round(amount * 100),
      description: `Quote payment #${booking.tripId}`,
      payment_options: {
        notification_url: `${baseUrl}/api/multisafepay-webhook`,
        notification_method: "GET",
        redirect_url: `${baseUrl}/${locale}/payment-success?method=quote`,
        cancel_url: `${baseUrl}/${locale}/pay/${encodeURIComponent(token)}`,
      },
      customer: {
        first_name: booking.firstName,
        last_name: booking.lastName,
        email: booking.email,
      },
      custom_info: {
        custom_1: "quote",
        custom_2: String(booking._id),
      },
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        api_key: apiKey,
      },
      body: JSON.stringify(orderPayload),
    });
    const data = await response.json();

    if (!response.ok || !data?.data?.payment_url) {
      console.error("MultiSafepay quote order failed:", data);
      return jsonError("payment_init_failed", 502);
    }

    await updateBookingFields(String(booking._id), {
      multisafepayOrderId: orderId,
    });

    return NextResponse.json({
      success: true,
      paymentUrl: data.data.payment_url,
      orderId,
    });
  } catch (error) {
    console.error("POST /api/pay/[token]/multisafepay:", error);
    return jsonError("internal_error", 500);
  }
}
