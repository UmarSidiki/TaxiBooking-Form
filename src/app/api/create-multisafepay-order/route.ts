import { NextRequest, NextResponse } from 'next/server';
import { Setting } from '@/models/settings';
import { connectDB } from '@/lib/database';
import { PendingBooking } from '@/models/booking';
import { generateShortId } from '@/lib/generate-id';
import { resolvePublicBaseUrl } from '@/lib/payments/resolve-base-url';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
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
    } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid amount' },
        { status: 400 }
      );
    }

    await connectDB();
    const settings = await Setting.findOne();
    const multisafepayApiKey = settings?.multisafepayApiKey;
    const multisafepayTestMode = settings?.multisafepayTestMode ?? true;

    if (!multisafepayApiKey) {
      return NextResponse.json(
        { success: false, message: 'MultiSafepay is not configured. Please add your API key in settings.' },
        { status: 500 }
      );
    }

    const baseUrl = resolvePublicBaseUrl(request);
    if (!baseUrl) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Public site URL is not configured. Set NEXT_PUBLIC_BASE_URL in Vercel (e.g. https://your-domain.com).',
        },
        { status: 500 }
      );
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
              totalAmount: totalAmount || amount,
            },
            paymentMethod: 'multisafepay',
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          },
        },
        { upsert: true, new: true }
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
      console.error('MultiSafepay API error:', data);
      return NextResponse.json(
        {
          success: false,
          message: data.error_info || 'Failed to create MultiSafepay order',
          details: data,
        },
        { status: response.status || 400 }
      );
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
    const message = e instanceof Error ? e.message : 'Failed to create MultiSafepay order';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
