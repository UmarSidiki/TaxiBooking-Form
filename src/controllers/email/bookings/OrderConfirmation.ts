import { sendEmail } from "@/lib/email";
import { connectDB } from "@/lib/database";
import { Setting } from "@/models/settings";
import { getCurrencySymbol } from "@/lib/utils";

interface BookingData {
  tripId: string;
  pickup: string;
  dropoff: string;
  stops: Array<{ location: string; order: number; duration?: number }>;
  tripType: string;
  date: string;
  time: string;
  returnDate?: string;
  returnTime?: string;
  passengers: number;
  selectedVehicle: string;
  vehicleDetails: {
    name: string;
    price: string;
    seats: string;
  };
  childSeats: number;
  babySeats: number;
  notes: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  totalAmount: number;
  subtotalAmount?: number;
  taxAmount?: number;
  taxPercentage?: number;
  taxIncluded?: boolean;
  paymentMethod?: string;
  paymentStatus?: string;
  flightNumber?: string;
  baseUrl?: string;
}

// Email validation utility
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generateEmailHTML(bookingData: BookingData, currency: string = 'EUR') {
  const currencySymbol = getCurrencySymbol(currency);
  const baseUrl = bookingData.baseUrl || process.env.NEXT_PUBLIC_BASE_URL

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Booking Confirmation - Reservation #${bookingData.tripId}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 14px; color: #333; }
    .container { max-width: 600px; margin: 0 auto; }
    .section { margin-bottom: 15px; }
    .section h2 { font-size: 16px; margin: 10px 0 5px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <p>Dear ${bookingData.firstName} ${bookingData.lastName},</p>
    <p>Your booking confirmation is below.</p>

    <div class="section">
      <h2>Reservation Details</h2>
      <table>
        <tr><td><strong>Reservation ID:</strong></td><td>#${bookingData.tripId}</td></tr>
        <tr><td><strong>From:</strong></td><td>${bookingData.pickup}</td></tr>
        ${bookingData.stops && bookingData.stops.length > 0 ? bookingData.stops.map((stop, index) => {
          const durationText = stop.duration && stop.duration > 0 
            ? ` (Wait: ${stop.duration >= 60 ? `${Math.floor(stop.duration / 60)}h${stop.duration % 60 > 0 ? ` ${stop.duration % 60}m` : ''}` : `${stop.duration}m`})`
            : '';
          return `<tr><td><strong>Stop ${index + 1}:</strong></td><td>${stop.location}${durationText}</td></tr>`;
        }).join('') : ''}
        <tr><td><strong>To:</strong></td><td>${bookingData.dropoff}</td></tr>
        <tr><td><strong>Departure:</strong></td><td>${bookingData.date} at ${bookingData.time}</td></tr>
        ${bookingData.tripType === 'roundtrip' && bookingData.returnDate ? 
          `<tr><td><strong>Return:</strong></td><td>${bookingData.returnDate} at ${bookingData.returnTime}</td></tr>` : ''}
        <tr><td><strong>Type:</strong></td><td>${bookingData.tripType}</td></tr>
        ${bookingData.flightNumber ? `<tr><td><strong>Flight:</strong></td><td>${bookingData.flightNumber}</td></tr>` : ''}
      </table>
    </div>

    <div class="section">
      <h2>Vehicle & Passengers</h2>
      <table>
        <tr><td><strong>Vehicle:</strong></td><td>${bookingData.vehicleDetails.name}</td></tr>
        <tr><td><strong>Seats:</strong></td><td>${bookingData.vehicleDetails.seats}</td></tr>
        <tr><td><strong>Passengers:</strong></td><td>${bookingData.passengers}</td></tr>
        ${bookingData.childSeats > 0 ? `<tr><td><strong>Child Seats:</strong></td><td>${bookingData.childSeats}</td></tr>` : ''}
        ${bookingData.babySeats > 0 ? `<tr><td><strong>Baby Seats:</strong></td><td>${bookingData.babySeats}</td></tr>` : ''}
      </table>
    </div>

    ${bookingData.notes ? `
    <div class="section">
      <h2>Special Requests</h2>
      <p>${bookingData.notes}</p>
    </div>
    ` : ''}

    <div class="section">
      <h2>Payment</h2>
      <table>
        ${bookingData.taxAmount && bookingData.taxAmount > 0 ? `
        <tr><td><strong>Subtotal:</strong></td><td>${currencySymbol}${(bookingData.subtotalAmount || bookingData.totalAmount).toFixed(2)}</td></tr>
        <tr><td><strong>Tax (${bookingData.taxPercentage || 0}%)${bookingData.taxIncluded ? ' - Included' : ''}:</strong></td><td>${currencySymbol}${bookingData.taxAmount.toFixed(2)}</td></tr>
        <tr><td><strong>Total:</strong></td><td>${currencySymbol}${bookingData.totalAmount.toFixed(2)}</td></tr>
        ` : `
        <tr><td><strong>Total:</strong></td><td>${currencySymbol}${bookingData.totalAmount.toFixed(2)}</td></tr>
        `}
        ${bookingData.paymentMethod ? `<tr><td><strong>Payment Method:</strong></td><td>${bookingData.paymentMethod.replace("_", " ")}</td></tr>` : ''}
        ${bookingData.paymentStatus ? `<tr><td><strong>Payment Status:</strong></td><td>${bookingData.paymentStatus}</td></tr>` : ''}
      </table>
    </div>

    <div class="section">
      <p>For questions, contact: ${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}</p>
      <p>Download Invoice: ${baseUrl}/api/invoice/${bookingData.tripId}</p>
      <p style="font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;">
        This is an automated email. Please do not reply.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendOrderConfirmationEmail(bookingData: BookingData) {
  try {
    // Validate email before sending
    if (!bookingData.email || !isValidEmail(bookingData.email)) {
      console.error("❌ Invalid customer email address:", bookingData.email);
      return false;
    }

    console.log("📧 Preparing confirmation email for:", bookingData.email);

    // Get SMTP settings for from address
    await connectDB();
    const settings = await Setting.findOne();
    const fromAddress = settings?.smtpFrom || settings?.smtpUser || "noreply@booking.com";
    const fromField = settings?.smtpSenderName ? `${settings.smtpSenderName} <${fromAddress}>` : fromAddress;
    const currency = settings?.stripeCurrency || 'EUR';
    const currencySymbol = getCurrencySymbol(currency);

    const htmlContent = generateEmailHTML(bookingData, currency);

    const success = await sendEmail({
      from: fromField,
      to: bookingData.email,
      subject: `Booking Confirmation - Reservation #${bookingData.tripId}`,
      html: htmlContent,
      text: `Booking Confirmed!\n\nReservation ID: ${bookingData.tripId}\nCustomer: ${bookingData.firstName} ${bookingData.lastName}\nFrom: ${bookingData.pickup}${bookingData.stops && bookingData.stops.length > 0 ? '\nStops: ' + bookingData.stops.map((stop, index) => {
        const durationText = stop.duration && stop.duration > 0 ? ` (Wait: ${stop.duration >= 60 ? `${Math.floor(stop.duration / 60)}h${stop.duration % 60 > 0 ? ` ${stop.duration % 60}m` : ''}` : `${stop.duration}m`})` : '';
        return `Stop ${index + 1}: ${stop.location}${durationText}`;
      }).join(', ') : ''}\nTo: ${bookingData.dropoff}\nDeparture Date: ${bookingData.date} at ${bookingData.time}${bookingData.tripType === 'roundtrip' && bookingData.returnDate ? `\nReturn Date: ${bookingData.returnDate} at ${bookingData.returnTime}` : ''}${bookingData.flightNumber ? `\nFlight Number: ${bookingData.flightNumber}` : ''}\nVehicle: ${bookingData.vehicleDetails.name}\nTotal Amount: ${currencySymbol}${bookingData.totalAmount}`,
    });

    if (!success) {
      console.error(
        "❌ Failed to send confirmation email to:",
        bookingData.email
      );
      return false;
    }

    console.log("✅ Confirmation email sent to:", bookingData.email);
    return true;
  } catch (error) {
    console.error("❌ Error sending confirmation email:", error);
    return false;
  }
}
