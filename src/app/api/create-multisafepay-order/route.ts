import { NextRequest, NextResponse } from 'next/server';
import { Setting } from '@/features/settings/model';
import { connectDB } from '@/shared/db';
import { PendingBooking } from '@/features/booking/model';
import { generateShortId } from '@/shared/lib/generate-id';
import { resolvePublicBaseUrl } from '@/features/payments/lib/resolve-base-url';
import { parseJsonBody } from '@/shared/http/parse-json-body';
import { jsonError } from '@/shared/http/json-error';
import { multisafepayOrderBodySchema } from '@/features/payments/schema/checkout.schema';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request, multisafepayOrderBodySchema);
    if (!parsed.ok) return parsed.response;
    const {
      amount,
      currency,
      customerEmail,
      customerName,
      description,
      orderId,
      locale,
      bookingData,
      totalAmount,
    } = parsed.data;

    await connectDB();
    const settings = await Setting.findOne();
    const multisafepayApiKey = settings?.multisafepayApiKey;
    const multisafepayTestMode = settings?.multisafepayTestMode ?? true;

    if (!multisafepayApiKey) {
      return jsonError("payment_not_configured", 500);
    }

    const baseUrl = resolvePublicBaseUrl(request);
    if (!baseUrl) {
      return jsonError("payment_not_configured", 500);
    }

    const apiUrl = multisafepayTestMode
      ? 'https://testapi.multisafepay.com/v1/json/orders'
      : 'https://api.multisafepay.com/v1/json/orders';

    const userLocale = locale || 'en';
    const generatedOrderId = orderId || generateShortId(5);
    const orderCurrency = (currency || settings?.stripeCurrency || 'EUR').toUpperCase();

    if (bookingData) {
      await PendingBooking.findOneAndUpdate(
        { orderId: generatedOrderId },
        {
          $set: {
            bookingData: {
              ...bookingData,
              locale: locale || bookingData.locale || "en",
              totalAmount: totalAmount || amount,
            },
            paymentMethod: 'multisafepay',
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          },
        },
        { upsert: true, returnDocument: 'after' }
      );
    }

    const orderPayload = {
      type: 'redirect',
      order_id: generatedOrderId,
      currency: orderCurrency,
      amount: Math.round(amount * 100),
      description: description || 'Booking payment',
      payment_options: {
        notification_url: `${baseUrl}/api/multisafepay-webhook`,
        notification_method: 'GET',
        redirect_url: `${baseUrl}/${userLocale}/payment-success`,
        cancel_url: `${baseUrl}/${userLocale}/payment-cancelled`,
      },
      customer: {
        email: customerEmail || 'customer@example.com',
        firstname: customerName?.split(' ')[0] || 'Customer',
        lastname: customerName?.split(' ').slice(1).join(' ') || 'Name',
      },
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        api_key: multisafepayApiKey,
      },
      body: JSON.stringify(orderPayload),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error("MultiSafepay API error");
      return jsonError("payment_failed", response.status || 400);
    }

    return NextResponse.json({
      success: true,
      paymentUrl: data.data.payment_url,
      orderId: data.data.order_id || generatedOrderId,
      merchantOrderId: generatedOrderId,
      amount: data.data.amount,
      currency: data.data.currency,
    });
  } catch (e: unknown) {
    console.error('Error creating MultiSafepay order:', e);
    return jsonError("internal_error", 500);
  }
}
