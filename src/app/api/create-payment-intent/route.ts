import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import Setting from '@/models/Setting';
import { connectDB } from '@/lib/mongoose';

export async function POST(request: NextRequest) {
  try {
    const { amount, currency, customerEmail, customerName, description } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Connect to database and get Stripe configuration from settings
    await connectDB();
    const settings = await Setting.findOne();
    const stripeSecretKey = settings?.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
    const stripeCurrency = currency || settings?.stripeCurrency || 'eur';
    const statementDescriptor = settings?.stripeStatementDescriptor || 'BOOKING';

    if (!stripeSecretKey) {
      return NextResponse.json(
        { success: false, message: 'Stripe is not configured. Please add your Stripe API keys in settings.' },
        { status: 500 }
      );
    }

    // Initialize Stripe client, optionally using API version if specified
    const stripeOptions: Stripe.StripeConfig = {};
    const stripeApiVersion = process.env.STRIPE_API_VERSION;
    if (stripeApiVersion) {
      stripeOptions.apiVersion = stripeApiVersion as Stripe.LatestApiVersion;
    }
    const stripe = new Stripe(stripeSecretKey, stripeOptions);

    // Payment intent options
    const paymentIntentOptions: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount * 100), // Convert to cents
      currency: stripeCurrency.toLowerCase(),
      // Let Stripe automatically determine available payment methods
      automatic_payment_methods: { enabled: true },
      statement_descriptor_suffix: statementDescriptor.substring(0, 22), // Max 22 characters
      description: description || 'Booking payment',
      metadata: {
        service: 'booking',
        timestamp: new Date().toISOString(),
      },
    };

    // Add customer email if provided
    if (customerEmail) {
      paymentIntentOptions.receipt_email = customerEmail;
      paymentIntentOptions.metadata = {
        ...paymentIntentOptions.metadata,
        customer_email: customerEmail,
      };
    }

    // Add customer name if provided
    if (customerName) {
      paymentIntentOptions.metadata = {
        ...paymentIntentOptions.metadata,
        customer_name: customerName,
      };
    }

    // Enable card saving for future off-session use if configured
    if (settings?.stripeSaveCards) {
      paymentIntentOptions.setup_future_usage = 'off_session';
    }
    
    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (e: unknown) {
    console.error('Error creating payment intent:', e);
    let message = 'Failed to create payment intent';
    let details = 'unknown_error';
    let statusCode = 500;
    // Handle Stripe errors explicitly
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
