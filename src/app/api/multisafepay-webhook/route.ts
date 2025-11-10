import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/database';
import { Booking, PendingBooking } from '@/models/booking';
import { Vehicle } from '@/models/vehicle';
import { Setting } from '@/models/settings';
import { sendOrderConfirmationEmail } from '@/controllers/email/bookings';
import { sendOrderNotificationEmail } from '@/controllers/email/bookings';
import { getCurrencySymbol } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // MultiSafepay sends transaction ID and status
    const { transactionid, order_id, status } = body;

    if (!transactionid || !order_id) {
      return NextResponse.json(
        { success: false, message: 'Missing transaction ID or order ID' },
        { status: 400 }
      );
    }

    await connectDB();

    console.log('MultiSafepay webhook received:', { order_id, transactionid, status });

    // Check if payment is completed
    if (status !== 'completed') {
      console.log('Payment not completed, status:', status);
      return NextResponse.json({ success: true, message: 'Payment not completed yet' });
    }

    // Check if booking already exists (avoid duplicate processing)
    const existingBooking = await Booking.findOne({
      $or: [
        { multisafepayOrderId: order_id },
        { multisafepayTransactionId: transactionid },
        { tripId: order_id }
      ]
    });

    if (existingBooking) {
      console.log('Booking already exists:', existingBooking.tripId);
      return NextResponse.json({ success: true, message: 'Booking already processed' });
    }

    // Find pending booking
    const pendingBooking = await PendingBooking.findOne({ orderId: order_id });

    if (!pendingBooking) {
      console.error('Pending booking not found for order:', order_id);
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

    // Get currency
    const setting = await Setting.findOne();
    const currency = setting?.stripeCurrency?.toUpperCase() || 'EUR';
    const currencySymbol = getCurrencySymbol(currency);

    // Create actual booking
    const bookingData = {
      tripId: order_id,
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
      multisafepayOrderId: order_id,
      multisafepayTransactionId: transactionid,
      status: 'upcoming',
      totalAmount: pendingBooking.bookingData.totalAmount,
    };

    // Save booking to database
    await Booking.create(bookingData);

    console.log('✅ Booking created successfully:', order_id);

    // Get base URL for invoice link
    const baseUrl = request.headers.get('origin') || 
                    request.headers.get('referer')?.split('/').slice(0, 3).join('/') || 
                    process.env.NEXT_PUBLIC_BASE_URL || 
                    'http://localhost:3000';

    // Prepare email data
    const emailData = {
      tripId: order_id,
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
    await PendingBooking.deleteOne({ orderId: order_id });

    return NextResponse.json({ success: true, message: 'Booking created and emails sent' });
  } catch (e: unknown) {
    console.error('Error processing MultiSafepay webhook:', e);
    const message = e instanceof Error ? e.message : 'Webhook processing failed';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
