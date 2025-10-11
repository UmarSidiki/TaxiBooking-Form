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

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-09-30.clover',
    });

    // Payment intent options
    const paymentIntentOptions: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount * 100), // Convert to cents
      currency: stripeCurrency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'always',
      },
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

    // Note: Automatic tax requires Stripe Tax to be configured in your Stripe Dashboard
    // and is typically enabled at the product/price level, not the PaymentIntent level

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create payment intent';
    
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        details: error instanceof Stripe.errors.StripeError ? error.type : 'unknown_error'
      },
      { status: 500 }
    );
  }
}
