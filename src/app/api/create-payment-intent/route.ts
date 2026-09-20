import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Setting } from '@/features/settings/model';
import { connectDB } from '@/shared/db';
import { PendingBooking } from '@/features/booking/model';
import { Vehicle } from '@/features/fleet/model';
import { generateShortId } from '@/shared/lib/generate-id';
import { DEFAULT_STRIPE_CURRENCY } from '@/features/payments/lib/stripe-currency';
import { getStripeClient } from '@/features/payments/lib/stripe-client';
import {
  calculateBookingPrice,
  fetchRouteDistanceKm,
} from '@/features/payments/lib/calculate-booking-total';
import { isValidEmail } from '@/shared/lib/validation';
import { parseJsonBody } from '@/shared/http/parse-json-body';
import { jsonError } from '@/shared/http/json-error';
import { paymentIntentBodySchema } from '@/features/payments/schema/checkout.schema';
import { registerPaymentMethodDomain } from '@/features/payments/lib/register-payment-method-domain';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request, paymentIntentBodySchema);
    if (!parsed.ok) return parsed.response;
    const { amount, currency, customerEmail, customerName, description, bookingData } =
      parsed.data;

    await connectDB();
    const settings = await Setting.findOne();
    const stripeCurrency = (currency || settings?.stripeCurrency || DEFAULT_STRIPE_CURRENCY).toLowerCase();
    const statementDescriptor = settings?.stripeStatementDescriptor || 'BOOKING';
    const stripe = await getStripeClient();

    if (!stripe) {
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
      bookingData.bookingType === "hourly"
        ? undefined
        : await fetchRouteDistanceKm({
            pickup: bookingData.pickup ?? "",
            dropoff: bookingData.dropoff ?? "",
            stops: bookingData.stops,
          });

    if (bookingData.bookingType !== 'hourly' && bookingData.pickup && bookingData.dropoff && distanceKm == null) {
      return jsonError("distance_failed", 400);
    }

    const priced = calculateBookingPrice(vehicle, bookingData, settings || {}, distanceKm);
    if (!priced.total || priced.total <= 0) {
      return jsonError("invalid_body", 400);
    }

    if (typeof amount === 'number' && amount > 0) {
      const delta = Math.abs(amount - priced.total);
      if (delta > Math.max(5, priced.total * 0.15)) {
        return jsonError("price_changed", 409);
      }
    }

    const orderId = generateShortId(5);
    const validEmail =
      customerEmail && isValidEmail(customerEmail)
        ? customerEmail.trim()
        : undefined;
    const validName =
      typeof customerName === 'string' && customerName.trim() && !/^First Last$/i.test(customerName.trim())
        ? customerName.trim()
        : undefined;

    const paymentIntentOptions: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(priced.total * 100),
      currency: stripeCurrency,
      automatic_payment_methods: { enabled: true },
      statement_descriptor_suffix: statementDescriptor.substring(0, 22),
      description: description || 'Booking payment',
      metadata: {
        service: 'booking',
        order_id: orderId,
      },
    };

    if (validEmail) {
      paymentIntentOptions.receipt_email = validEmail;
      paymentIntentOptions.metadata = {
        ...paymentIntentOptions.metadata,
        customer_email: validEmail,
      };
    }

    if (validName) {
      paymentIntentOptions.metadata = {
        ...paymentIntentOptions.metadata,
        customer_name: validName,
      };
    }

    if (settings?.stripeSaveCards) {
      paymentIntentOptions.payment_method_options = {
        card: { setup_future_usage: 'off_session' },
      };
    }

    void registerPaymentMethodDomain(stripe, request);

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions, {
      idempotencyKey: `booking_${orderId}`,
    });

    await PendingBooking.findOneAndUpdate(
      { orderId },
      {
        $set: {
          bookingData: {
            ...bookingData,
            totalAmount: priced.total,
            subtotalAmount: priced.subtotal,
            taxAmount: priced.taxAmount,
            taxPercentage: priced.taxPercentage,
          },
          paymentMethod: 'stripe',
          paymentIntentId: paymentIntent.id,
          expectedAmount: priced.total,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      orderId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (e: unknown) {
    console.error('Error creating payment intent:', e);
    if (e instanceof Stripe.errors.StripeError) {
      return jsonError("payment_failed", e.statusCode || 500);
    }
    return jsonError("internal_error", 500);
  }
}
