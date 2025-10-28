import { NextRequest, NextResponse } from 'next/server';
import Setting from '@/models/Setting';
import { connectDB } from '@/lib/mongoose';

export async function POST(request: NextRequest) {
  try {
    const { amount, currency, customerEmail, customerName, description, orderId } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Connect to database and get MultiSafepay configuration from settings
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

    // MultiSafepay API endpoint (test or live)
    const apiUrl = multisafepayTestMode
      ? 'https://testapi.multisafepay.com/v1/json/orders'
      : 'https://api.multisafepay.com/v1/json/orders';

    // Create order payload
    const orderPayload = {
      type: 'redirect',
      order_id: orderId || `order_${Date.now()}`,
      currency: (currency || 'EUR').toUpperCase(),
      amount: Math.round(amount * 100), // Amount in cents
      description: description || 'Booking payment',
      payment_options: {
        notification_url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/multisafepay-webhook`,
        redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/payment-success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/payment-cancelled`,
      },
      customer: {
        email: customerEmail || 'customer@example.com',
        firstname: customerName?.split(' ')[0] || 'Customer',
        lastname: customerName?.split(' ').slice(1).join(' ') || 'Name',
      },
    };

    // Make request to MultiSafepay API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': multisafepayApiKey,
      },
      body: JSON.stringify(orderPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('MultiSafepay API error:', data);
      return NextResponse.json(
        { 
          success: false, 
          message: data.error_info || 'Failed to create MultiSafepay order',
          details: data 
        },
        { status: response.status }
      );
    }

    // Return payment URL and order details
    return NextResponse.json({
      success: true,
      paymentUrl: data.data.payment_url,
      orderId: data.data.order_id,
      amount: data.data.amount,
      currency: data.data.currency,
    });
  } catch (e: unknown) {
    console.error('Error creating MultiSafepay order:', e);
    const message = e instanceof Error ? e.message : 'Failed to create MultiSafepay order';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
