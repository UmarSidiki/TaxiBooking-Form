import { NextRequest, NextResponse } from 'next/server';
import { Setting } from '@/models/settings';
import { connectDB } from '@/lib/database';
import { PendingBooking } from '@/models/booking';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { amount, currency, customerEmail, customerName, description, orderId, locale, bookingData, totalAmount } = await request.json();

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

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin') || '';
    const userLocale = locale || 'en';
    
    // Generate unique order ID
    const generatedOrderId = orderId || uuidv4();
    
    // Store pending booking data (will be converted to actual booking on successful payment)
    if (bookingData) {
      await PendingBooking.create({
        orderId: generatedOrderId,
        bookingData: {
          ...bookingData,
          totalAmount: totalAmount || amount,
        },
        paymentMethod: 'multisafepay',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes expiry
      });
    }
    
    // Create order payload
    const orderPayload = {
      type: 'redirect',
      order_id: generatedOrderId,
      currency: (currency || 'EUR').toUpperCase(),
      amount: Math.round(amount * 100), // Amount in cents
      description: description || 'Booking payment',
      payment_options: {
        notification_url: `${baseUrl}/api/multisafepay-webhook`,
        redirect_url: `${baseUrl}/${userLocale}/payment-success`,
        cancel_url: `${baseUrl}/${userLocale}/payment-cancelled`,
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
