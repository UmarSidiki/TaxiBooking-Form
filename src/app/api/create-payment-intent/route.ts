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

export const dynamic = 'force-dynamic';

const registeredDomains = new Set<string>();

async function registerPaymentMethodDomain(stripe: Stripe, request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const domain = host?.split(':')[0]?.toLowerCase();
  if (!domain || domain === 'localhost' || domain.endsWith('.local')) {
    return;
  }
  if (registeredDomains.has(domain)) {
    return;
  }

  try {
    await stripe.paymentMethodDomains.create({ domain_name: domain });
    registeredDomains.add(domain);
  } catch (error) {
    registeredDomains.add(domain);
    if (
      error instanceof Stripe.errors.StripeError &&
      error.code !== 'resource_already_exists'
    ) {
      console.warn('Could not register Stripe payment method domain:', error.message);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      amount,
      currency,
      customerEmail,
      customerName,
      description,
      bookingData,
    } = await request.json();

    if (!bookingData?.selectedVehicle) {
      return NextResponse.json(
        { success: false, message: 'Booking data is required' },
        { status: 400 }
      );
    }

    await connectDB();
    const settings = await Setting.findOne();
    const stripeCurrency = (currency || settings?.stripeCurrency || DEFAULT_STRIPE_CURRENCY).toLowerCase();
    const statementDescriptor = settings?.stripeStatementDescriptor || 'BOOKING';
    const stripe = await getStripeClient();

    if (!stripe) {
      return NextResponse.json(
        { success: false, message: 'Stripe is not configured. Please add your Stripe API keys in settings.' },
        { status: 500 }
      );
    }

    const vehicle = await Vehicle.findById(bookingData.selectedVehicle);
    if (!vehicle) {
      return NextResponse.json(
        { success: false, message: 'Selected vehicle was not found' },
        { status: 400 }
      );
    }

    if (bookingData.bookingType !== 'hourly' && (!bookingData.pickup || !bookingData.dropoff)) {
      return NextResponse.json(
        { success: false, message: 'Pickup and destination are required' },
        { status: 400 }
      );
    }

    const distanceKm =
      bookingData.bookingType === 'hourly'
        ? undefined
        : await fetchRouteDistanceKm({
            pickup: bookingData.pickup,
            dropoff: bookingData.dropoff,
            stops: bookingData.stops,
          });

    if (bookingData.bookingType !== 'hourly' && bookingData.pickup && bookingData.dropoff && distanceKm == null) {
      return NextResponse.json(
        { success: false, message: 'Could not calculate trip distance. Please try again.' },
        { status: 400 }
      );
    }

    const priced = calculateBookingPrice(vehicle, bookingData, settings || {}, distanceKm);
    if (!priced.total || priced.total <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid amount' },
        { status: 400 }
      );
    }

    if (typeof amount === 'number' && amount > 0) {
      const delta = Math.abs(amount - priced.total);
      if (delta > Math.max(5, priced.total * 0.15)) {
        return NextResponse.json(
          {
            success: false,
            message: 'The price changed. Please refresh and try again.',
          },
          { status: 409 }
        );
      }
    }

    const orderId = generateShortId(5);
    const validEmail = isValidEmail(customerEmail) ? customerEmail.trim() : undefined;
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
    let message = 'Failed to create payment intent';
    let details = 'unknown_error';
    let statusCode = 500;
    if (e instanceof Stripe.errors.StripeError) {
      message = e.message;
      details = e.type;
      statusCode = e.statusCode || 500;
    } else if (e instanceof Error) {
      message = e.message;
    }
    return NextResponse.json(
      { success: false, message, details },
      { status: statusCode }
    );
  }
}
