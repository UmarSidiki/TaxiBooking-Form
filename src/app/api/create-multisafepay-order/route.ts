import { NextRequest, NextResponse } from 'next/server';
import { Setting } from '@/features/settings/model';
import { connectDB } from '@/shared/db';
import { PendingBooking } from '@/features/booking/model';
import { Vehicle } from '@/features/fleet/model';
import { generateShortId } from '@/shared/lib/generate-id';
import { resolvePublicUrl } from '@/features/settings/lib/public-url';
import { priceServerBooking } from '@/features/pricing/lib/price-server-booking';
import { chargeDrift } from '@/features/pricing/lib/deposit-charge';
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
      draftId,
      amount,
      customerEmail,
      customerName,
      description,
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

    const baseUrl = await resolvePublicUrl({ request });
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

    const serverPrice = await priceServerBooking({
      vehicle,
      booking: bookingData,
      distanceKm,
      tax: settings || {},
      redeem: true,
    });
    if (!serverPrice.ok) return jsonError(serverPrice.error, 400);
    const priced = serverPrice.quote;
    if (!priced.total || priced.total <= 0) {
      return jsonError("invalid_body", 400);
    }

    // The client amount is advisory only: it may drift, but it can never set the charge.
    if (chargeDrift(amount, priced.chargeAmount)) {
      return jsonError("price_changed", 409);
    }

    const apiUrl = multisafepayTestMode
      ? 'https://testapi.multisafepay.com/v1/json/orders'
      : 'https://api.multisafepay.com/v1/json/orders';

    const userLocale = locale || 'en';
    const existingPending = await PendingBooking.findOne({ draftId });
    const generatedOrderId = existingPending?.orderId ?? generateShortId(5);
    const orderCurrency = (settings?.stripeCurrency || 'EUR').toUpperCase();

    const pendingDocument = {
      bookingData: {
        ...bookingData,
        locale: locale || bookingData.locale || "en",
        totalAmount: priced.total,
        subtotalAmount: priced.subtotal,
        taxAmount: priced.taxAmount,
        taxPercentage: priced.taxPercentage,
        depositDue: priced.depositDue,
        balanceDue: priced.balanceDue,
        fareLines: priced.lines,
        promoCode: priced.promoCode,
      },
      paymentMethod: 'multisafepay',
      status: 'open' as const,
      expectedAmount: priced.chargeAmount,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    };

    if (existingPending) {
      existingPending.set(pendingDocument);
      await existingPending.save();
    } else {
      try {
        await PendingBooking.create({
          draftId,
          orderId: generatedOrderId,
          ...pendingDocument,
        });
      } catch (error) {
        const raced = await PendingBooking.findOne({ draftId });
        if (!raced) throw error;
        raced.set(pendingDocument);
        await raced.save();
      }
    }

    const orderPayload = {
      type: 'redirect',
      order_id: generatedOrderId,
      currency: orderCurrency,
      amount: Math.round(priced.chargeAmount * 100),
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
