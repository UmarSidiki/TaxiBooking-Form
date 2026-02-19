import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { connectDB } from '@/lib/database';
import { Booking, PendingBooking } from '@/models/booking';
import { Vehicle } from '@/models/vehicle';
import { Setting } from '@/models/settings';
import { sendOrderConfirmationEmail } from '@/controllers/email/bookings';
import { sendOrderNotificationEmail } from '@/controllers/email/bookings';
import { getCurrencySymbol } from '@/lib/utils';
import { notifyEligiblePartners } from '@/lib/partners/notify-eligible-partners';

// Disable body parsing - we need the raw body for signature verification
export const dynamic = 'force-dynamic';

async function getRawBody(request: NextRequest): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  const reader = request.body?.getReader();
  
  if (!reader) {
    throw new Error('No body in request');
  }
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  return Buffer.concat(chunks);
}

export async function POST(request: NextRequest) {
  let event: Stripe.Event;
  
  try {
    await connectDB();
    
    // Get Stripe configuration from settings
    const settings = await Setting.findOne();
    const stripeSecretKey = settings?.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
    const stripeWebhookSecret = settings?.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!stripeSecretKey) {
      console.error('Stripe secret key not configured');
      return NextResponse.json(
        { success: false, message: 'Stripe is not configured' },
        { status: 500 }
      );
    }
    
    if (!stripeWebhookSecret) {
      console.error('Stripe webhook secret not configured');
      return NextResponse.json(
        { success: false, message: 'Stripe webhook secret is not configured' },
        { status: 500 }
      );
    }
    
    // Initialize Stripe client
    const stripeOptions: Stripe.StripeConfig = {};
    const stripeApiVersion = process.env.STRIPE_API_VERSION;
    if (stripeApiVersion) {
      stripeOptions.apiVersion = stripeApiVersion as Stripe.LatestApiVersion;
    }
    const stripe = new Stripe(stripeSecretKey, stripeOptions);
    
    // Get raw body for signature verification
    const rawBody = await getRawBody(request);
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      console.error('No Stripe signature found in request');
      return NextResponse.json(
        { success: false, message: 'No signature found' },
        { status: 400 }
      );
    }
    
    // Verify webhook signature
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        stripeWebhookSecret
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Webhook signature verification failed:', errorMessage);
      return NextResponse.json(
        { success: false, message: `Webhook signature verification failed: ${errorMessage}` },
        { status: 400 }
      );
    }
    
    console.log('✅ Stripe webhook received:', event.type);
    
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, settings);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ success: true, received: true });
  } catch (e: unknown) {
    console.error('Error processing Stripe webhook:', e);
    const message = e instanceof Error ? e.message : 'Webhook processing failed';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  settings: { stripeCurrency?: string } | null
) {
  const paymentIntentId = paymentIntent.id;
  const orderId = paymentIntent.metadata?.order_id;
  
  console.log('💳 Payment succeeded:', { paymentIntentId, orderId });
  
  // Check if booking already exists (avoid duplicate processing)
  const existingBooking = await Booking.findOne({
    $or: [
      { stripePaymentIntentId: paymentIntentId },
      ...(orderId ? [{ tripId: orderId }] : [])
    ]
  });
  
  if (existingBooking) {
    console.log('📋 Booking already exists:', existingBooking.tripId);
    return;
  }
  
  // Try to find pending booking
  if (!orderId) {
    console.log('⚠️ No order_id in payment intent metadata - booking may have been created by frontend');
    return;
  }
  
  const pendingBooking = await PendingBooking.findOne({ orderId });
  
  if (!pendingBooking) {
    console.log('⚠️ Pending booking not found for order:', orderId, '- booking may have been created by frontend');
    return;
  }
  
  // Get vehicle details
  const vehicle = await Vehicle.findById(pendingBooking.bookingData.selectedVehicle);
  
  if (!vehicle) {
    console.error('❌ Vehicle not found:', pendingBooking.bookingData.selectedVehicle);
    return;
  }
  
  // Verify Payment Amount Integrity
  const paidAmountSafe = paymentIntent.amount_received / 100; // Convert cents to main unit
  const expectedAmount = Number(pendingBooking.bookingData.totalAmount);
  
  // Allow for small floating point differences
  if (Math.abs(paidAmountSafe - expectedAmount) > 0.05) {
      console.error(`⚠️ Payment Amount Mismatch! Paid: ${paidAmountSafe}, Expected: ${expectedAmount}. Order: ${orderId}`);
      // Security decision: We record the ACTUAL paid amount to the booking to prevent fraud.
      // Alternatively you could fail the booking, but it's better to capture the record and flag it.
      pendingBooking.bookingData.totalAmount = paidAmountSafe;
  }

  // Get currency from the payment object itself for accuracy
  const currency = paymentIntent.currency ? paymentIntent.currency.toUpperCase() : (settings?.stripeCurrency?.toUpperCase() || 'EUR');
  const currencySymbol = getCurrencySymbol(currency);
  
  // Create actual booking
  const bookingData = {
    tripId: orderId,
    pickup: pendingBooking.bookingData.pickup,
    dropoff: pendingBooking.bookingData.dropoff || '',
    stops: pendingBooking.bookingData.stops || [],
    tripType: pendingBooking.bookingData.tripType,
    bookingType: pendingBooking.bookingData.bookingType,
    duration: pendingBooking.bookingData.duration,
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
    paymentMethod: 'stripe',
    paymentStatus: 'completed',
    stripePaymentIntentId: paymentIntentId,
    status: 'upcoming',
    totalAmount: pendingBooking.bookingData.totalAmount,
    subtotalAmount: pendingBooking.bookingData.subtotalAmount,
    taxAmount: pendingBooking.bookingData.taxAmount,
    taxPercentage: pendingBooking.bookingData.taxPercentage,
  };
  
  // Save booking to database
  const newBooking = await Booking.create(bookingData);
  
  console.log('✅ Booking created successfully:', orderId);
  
  // Get base URL for invoice link
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  
  // Prepare email data
  const emailData = {
    tripId: orderId,
    bookingId: newBooking._id.toString(),
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
    subtotalAmount: pendingBooking.bookingData.subtotalAmount,
    taxAmount: pendingBooking.bookingData.taxAmount,
    taxPercentage: pendingBooking.bookingData.taxPercentage,
    paymentMethod: 'stripe',
    paymentStatus: 'completed',
    baseUrl: baseUrl,
  };
  
  // Send confirmation emails
  try {
    console.log('📧 Sending confirmation emails...');
    
    // Send emails in parallel to save time and prevent timeouts
    await Promise.all([
        sendOrderConfirmationEmail(emailData).catch(err => 
            console.error('❌ Failed to send confirmation email:', err)
        ),
        sendOrderNotificationEmail(emailData).catch(err => 
            console.error('❌ Failed to send admin notification email:', err)
        )
    ]);
    
    console.log('📧 Email sending process initiated');
  } catch (emailError) {
    console.error('❌ Error sending emails:', emailError);
    // Don't fail the webhook if emails fail
  }
  
  // Notify eligible partners if applicable
  try {
    await notifyEligiblePartners(newBooking._id.toString(), baseUrl);
  } catch (partnerError) {
    console.error('❌ Error notifying partners:', partnerError);
  }
  
  // Delete pending booking
  await PendingBooking.deleteOne({ orderId });
  
  console.log('✅ Stripe webhook processing completed for:', orderId);
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.order_id;
  
  console.log('❌ Payment failed:', { paymentIntentId: paymentIntent.id, orderId });
  
  // Delete pending booking if exists
  if (orderId) {
    await PendingBooking.deleteOne({ orderId });
    console.log('🗑️ Deleted pending booking for failed payment:', orderId);
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId = typeof charge.payment_intent === 'string' 
    ? charge.payment_intent 
    : charge.payment_intent?.id;
  
  if (!paymentIntentId) {
    console.log('No payment intent ID in refund charge');
    return;
  }
  
  console.log('💰 Charge refunded:', { chargeId: charge.id, paymentIntentId });
  
  // Update booking payment status
  const booking = await Booking.findOne({ stripePaymentIntentId: paymentIntentId });
  
  if (booking) {
    const amountRefunded = charge.amount_refunded / 100; // Convert from cents
    const totalAmount = booking.totalAmount || 0;
    const refundPercentage = totalAmount > 0 ? (amountRefunded / totalAmount) * 100 : 0;
    
    await Booking.updateOne(
      { stripePaymentIntentId: paymentIntentId },
      { 
        $set: { 
          paymentStatus: charge.refunded ? 'refunded' : 'completed',
          refundAmount: amountRefunded,
          refundPercentage: refundPercentage
        } 
      }
    );
    console.log('✅ Booking payment status updated to refunded:', booking.tripId);
  }
}
