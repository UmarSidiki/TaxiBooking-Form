import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/database';
import { Booking, PendingBooking } from '@/models/booking';
import { Vehicle } from '@/models/vehicle';
import { Setting } from '@/models/settings';
import { sendOrderConfirmationEmail, sendOrderNotificationEmail } from '@/controllers/email/bookings';
import { getCurrencySymbol } from '@/lib/utils';

export async function GET(request: NextRequest) {
  return handleWebhook(request);
}

export async function POST(request: NextRequest) {
  return handleWebhook(request);
}

async function handleWebhook(request: NextRequest) {
  try {
    let transactionid: string | null = null;
    let order_id: string | null = null;

    // 1. Try to parse from Query Parameters (Standard MultiSafepay GET webhook)
    const searchParams = request.nextUrl.searchParams;
    if (searchParams.has('transactionid')) {
      transactionid = searchParams.get('transactionid');
    }

    // 2. Fallback: Try to parse from Body (if POST)
    if (!transactionid && request.method === 'POST') {
      try {
        const body = await request.json();
        transactionid = body.transactionid;
        order_id = body.order_id;
      } catch (e) {
        // Ignore JSON parse error, might be empty body
      }
    }

    if (!transactionid && !order_id) {
        console.error('MultiSafepay webhook: No transaction ID found');
        return NextResponse.json(
            { success: false, message: 'Missing transaction ID or order ID' },
            { status: 400 }
        );
    }
    
    // Use transactionid as the lookup ID (which corresponds to our orderId)
    const lookupId = transactionid || order_id;

    await connectDB();

    console.log(`MultiSafepay webhook received for: ${lookupId}`);

    // Fetch Settings to get API Key
    const settings = await Setting.findOne();
    const multisafepayApiKey = settings?.multisafepayApiKey;
    const multisafepayTestMode = settings?.multisafepayTestMode ?? true;

    if (!multisafepayApiKey) {
        console.error('MultiSafepay API Key not configured');
        return NextResponse.json(
            { success: false, message: 'Server misconfiguration' }, 
            { status: 500 }
        );
    }

    // Verify status with MultiSafepay API
    const apiUrl = multisafepayTestMode
      ? `https://testapi.multisafepay.com/v1/json/orders/${lookupId}`
      : `https://api.multisafepay.com/v1/json/orders/${lookupId}`;
    
    const mspResponse = await fetch(apiUrl, {
        method: 'GET',
        headers: {
            'api_key': multisafepayApiKey,
            'Content-Type': 'application/json'
        }
    });

    if (!mspResponse.ok) {
        console.error(`MultiSafepay API check failed: ${mspResponse.status}`);
        return NextResponse.json({ success: false, message: 'Could not verify order status' }, { status: 502 });
    }

    const mspData = await mspResponse.json();
    
    if (!mspData.success) {
        console.error('MultiSafepay API returned error:', mspData);
        return NextResponse.json({ success: false, message: 'MultiSafepay API error' }, { status: 400 });
    }

    const actualStatus = mspData.data.status;
    const actualOrderId = mspData.data.order_id;

    console.log(`Order ${lookupId} verified status: ${actualStatus}`);

    // Check if payment is completed
    if (actualStatus !== 'completed') {
      console.log('Payment not completed, status:', actualStatus);
      return NextResponse.json({ success: true, message: 'Payment not completed yet' });
    }

    // Check if booking already exists (avoid duplicate processing)
    const existingBooking = await Booking.findOne({
      $or: [
        { multisafepayOrderId: actualOrderId },
        { multisafepayTransactionId: transactionid },
        { tripId: actualOrderId }
      ]
    });

    if (existingBooking) {
      console.log('Booking already processed:', existingBooking.tripId);
      return NextResponse.json({ success: true, message: 'Booking already processed' });
    }

    // Find pending booking
    const pendingBooking = await PendingBooking.findOne({ orderId: actualOrderId });

    if (!pendingBooking) {
      console.error('Pending booking not found for order:', actualOrderId);
      return NextResponse.json(
        { success: false, message: 'Pending booking not found' },
        { status: 404 }
      );
    }

    // Get vehicle details
    const vehicle = await Vehicle.findById(pendingBooking.bookingData.selectedVehicle);
    
    if (!vehicle) {
      console.error('Vehicle not found:', pendingBooking.bookingData.selectedVehicle);
      return NextResponse.json(
        { success: false, message: 'Vehicle not found' },
        { status: 404 }
      );
    }

    // Verify Payment Amount Integrity from MultiSafepay API response
    const paidAmountSafe = mspData.data.amount ? mspData.data.amount / 100 : 0; // Convert cents to main unit
    const expectedAmount = Number(pendingBooking.bookingData.totalAmount);
    
    // Allow for small floating point differences
    if (Math.abs(paidAmountSafe - expectedAmount) > 0.05) {
        console.error(`⚠️ Payment Amount Mismatch! Paid: ${paidAmountSafe}, Expected: ${expectedAmount}. Order: ${actualOrderId}`);
        // Security decision: We record the ACTUAL paid amount to the booking to prevent fraud.
        pendingBooking.bookingData.totalAmount = paidAmountSafe;
    }

    // Get currency
    const currency = settings?.stripeCurrency?.toUpperCase() || 'EUR';
    const currencySymbol = getCurrencySymbol(currency);

    // Create actual booking
    const bookingData = {
      tripId: actualOrderId,
      pickup: pendingBooking.bookingData.pickup,
      dropoff: pendingBooking.bookingData.dropoff || '',
      stops: pendingBooking.bookingData.stops || [],
      tripType: pendingBooking.bookingData.tripType,
      date: pendingBooking.bookingData.date,
      time: pendingBooking.bookingData.time,
      returnDate: pendingBooking.bookingData.returnDate,
      returnTime: pendingBooking.bookingData.returnTime,
      passengers: pendingBooking.bookingData.passengers,
      selectedVehicle: pendingBooking.bookingData.selectedVehicle,
      vehicleDetails: {
        name: vehicle.name,
        price: `${currencySymbol}${vehicle.price}`,
        seats: `${vehicle.persons} persons`,
      },
      childSeats: pendingBooking.bookingData.childSeats,
      babySeats: pendingBooking.bookingData.babySeats,
      notes: pendingBooking.bookingData.notes,
      flightNumber: pendingBooking.bookingData.flightNumber,
      firstName: pendingBooking.bookingData.firstName,
      lastName: pendingBooking.bookingData.lastName,
      email: pendingBooking.bookingData.email,
      phone: pendingBooking.bookingData.phone,
      paymentMethod: 'multisafepay',
      paymentStatus: 'completed',
      multisafepayOrderId: actualOrderId,
      multisafepayTransactionId: transactionid,
      status: 'upcoming',
      totalAmount: pendingBooking.bookingData.totalAmount,
    };

    // Save booking to database
    await Booking.create(bookingData);

    console.log('✅ Booking created successfully:', actualOrderId);

    // Get base URL for invoice link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    request.headers.get('origin') || 
                    'https://yourdomain.com';

    // Prepare email data
    const emailData = {
      tripId: actualOrderId,
      pickup: pendingBooking.bookingData.pickup,
      dropoff: pendingBooking.bookingData.dropoff || 'N/A (Hourly booking)',
      stops: pendingBooking.bookingData.stops || [],
      tripType: pendingBooking.bookingData.tripType,
      date: pendingBooking.bookingData.date,
      time: pendingBooking.bookingData.time,
      returnDate: pendingBooking.bookingData.returnDate,
      returnTime: pendingBooking.bookingData.returnTime,
      passengers: pendingBooking.bookingData.passengers,
      selectedVehicle: pendingBooking.bookingData.selectedVehicle,
      vehicleDetails: {
        name: vehicle.name,
        price: `${currencySymbol}${vehicle.price}`,
        seats: `${vehicle.persons} persons`,
      },
      childSeats: pendingBooking.bookingData.childSeats,
      babySeats: pendingBooking.bookingData.babySeats,
      notes: pendingBooking.bookingData.notes,
      flightNumber: pendingBooking.bookingData.flightNumber,
      firstName: pendingBooking.bookingData.firstName,
      lastName: pendingBooking.bookingData.lastName,
      email: pendingBooking.bookingData.email,
      phone: pendingBooking.bookingData.phone,
      totalAmount: pendingBooking.bookingData.totalAmount,
      paymentMethod: 'multisafepay',
      paymentStatus: 'completed',
      baseUrl: baseUrl,
    };

    // Send confirmation emails
    try {
      console.log('📧 Sending confirmation email to:', emailData.email);
      await sendOrderConfirmationEmail(emailData);
      
      console.log('📧 Sending notification email to admin');
      await sendOrderNotificationEmail(emailData);
    } catch (emailError) {
      console.error('❌ Error sending emails:', emailError);
      // Don't fail the webhook if emails fail
    }

    // Delete pending booking
    await PendingBooking.deleteOne({ orderId: actualOrderId });

    return new NextResponse('OK', { status: 200 });
    
  } catch (e: unknown) {
    console.error('Error processing MultiSafepay webhook:', e);
    const message = e instanceof Error ? e.message : 'Webhook processing failed';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
