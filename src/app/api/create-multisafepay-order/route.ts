import { NextRequest, NextResponse } from 'next/server';
import { Setting } from '@/features/settings/model';
import { connectDB } from '@/shared/db';
import { PendingBooking } from '@/features/booking/model';
import { Vehicle } from '@/features/fleet/model';
import { generateShortId } from '@/shared/lib/generate-id';
import { resolvePublicBaseUrl } from '@/features/payments/lib/resolve-base-url';
import { calculateBookingPrice } from '@/features/payments/lib/fare/calculate-booking-price';
import { fetchRouteDistanceKm } from '@/features/payments/lib/fare/route-distance';
import { parseJsonBody } from '@/shared/http/parse-json-body';
import { jsonError } from '@/shared/http/json-error';
import { blockIfCountryNotAllowed } from '@/features/geo/lib/booking-country-policy';
import { multisafepayOrderBodySchema } from '@/features/payments/schema/checkout.schema';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request, multisafepayOrderBodySchema);
    if (!parsed.ok) return parsed.response;

    const country = await blockIfCountryNotAllowed(request);
    if (!country.ok) {
      return jsonError("country_blocked", 403);
    }
    const {
      amount,
      currency,
      customerEmail,
      customerName,
      description,
      orderId,
      locale,
      bookingData,
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

    const vehicle = await Vehicle.findById(bookingData.selectedVehicle);
    if (!vehicle) {
      return jsonError("not_found", 400);
    }

    if (bookingData.bookingType !== 'hourly' && (!bookingData.pickup || !bookingData.dropoff)) {
      return jsonError("invalid_body", 400);
    }

    const distanceKm =
      bookingData.bookingType === 'hourly'
        ? undefined
        : await fetchRouteDistanceKm({
            pickup: bookingData.pickup ?? '',
            dropoff: bookingData.dropoff ?? '',
            stops: bookingData.stops,
          });

    if (bookingData.bookingType !== 'hourly' && bookingData.pickup && bookingData.dropoff && distanceKm == null) {
      return jsonError("distance_failed", 400);
    }

    const priced = calculateBookingPrice(vehicle, bookingData, settings || {}, distanceKm);
    if (!priced.total || priced.total <= 0) {
      return jsonError("invalid_body", 400);
    }

    // The client amount is advisory only: it may drift, but it can never set the charge.
    if (typeof amount === 'number' && amount > 0) {
      const delta = Math.abs(amount - priced.total);
      if (delta > Math.max(5, priced.total * 0.15)) {
        return jsonError("price_changed", 409);
      }
    }

    const apiUrl = multisafepayTestMode
      ? 'https://testapi.multisafepay.com/v1/json/orders'
      : 'https://api.multisafepay.com/v1/json/orders';

    const userLocale = locale || 'en';
    const generatedOrderId = orderId || generateShortId(5);
    const orderCurrency = (currency || settings?.stripeCurrency || 'EUR').toUpperCase();

    await PendingBooking.findOneAndUpdate(
      { orderId: generatedOrderId },
      {
        $set: {
          bookingData: {
            ...bookingData,
            locale: locale || bookingData.locale || "en",
            totalAmount: priced.total,
            subtotalAmount: priced.subtotal,
            taxAmount: priced.taxAmount,
            taxPercentage: priced.taxPercentage,
          },
          paymentMethod: 'multisafepay',
          expectedAmount: priced.total,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    const orderPayload = {
      type: 'redirect',
      order_id: generatedOrderId,
      currency: orderCurrency,
      amount: Math.round(priced.total * 100),
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
