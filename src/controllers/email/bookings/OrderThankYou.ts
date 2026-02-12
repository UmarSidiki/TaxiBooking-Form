import { sendEmail } from "@/lib/email";
import { connectDB } from "@/lib/database";
import { Setting } from "@/models/settings";

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
  bookingId?: string;
  baseUrl?: string;
}

// Email validation utility
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generateEmailHTML(bookingData: BookingData) {
  const baseUrl = bookingData.baseUrl ? bookingData.baseUrl.replace(/\/$/, "") : "";
  const reviewUrl = bookingData.bookingId && baseUrl 
    ? `${baseUrl}/en/review?bookingId=${bookingData.bookingId}`
    : null;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Thank You - Reservation #${bookingData.tripId}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background-color: #f5f5f5; padding: 15px; border-left: 4px solid #0369a1; margin-bottom: 20px; }
    .header h1 { margin: 0 0 5px 0; font-size: 18px; color: #0369a1; }
    .section { margin-bottom: 20px; }
    .section h2 { font-size: 15px; color: #0369a1; margin: 15px 0 8px 0; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; }
    tr { border-bottom: 1px solid #f0f0f0; }
    td { padding: 8px 0; }
    td:first-child { width: 40%; color: #666; }
    .review-section { background-color: #f9f9f9; padding: 15px; border-radius: 3px; text-align: center; }
    .footer { font-size: 12px; color: #999; margin-top: 25px; border-top: 1px solid #ddd; padding-top: 15px; }
    a { color: #0369a1; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Thank You for Your Trip!</h1>
      <p>Dear ${bookingData.firstName} ${bookingData.lastName},</p>
      <p>We appreciate choosing our service for your recent journey.</p>
    </div>

    <div class="section">
      <h2>Your Trip Summary</h2>
      <table>
        <tr><td><strong>Reservation ID:</strong></td><td>#${bookingData.tripId}</td></tr>
        <tr><td><strong>From:</strong></td><td>${bookingData.pickup}</td></tr>
        ${bookingData.stops && bookingData.stops.length > 0 ? bookingData.stops.map((stop, index) =>
          `<tr><td><strong>Stop ${index + 1}:</strong></td><td>${stop.location}</td></tr>`
        ).join('') : ''}
        <tr><td><strong>To:</strong></td><td>${bookingData.dropoff}</td></tr>
        <tr><td><strong>Date:</strong></td><td>${bookingData.date} at ${bookingData.time}</td></tr>
        ${bookingData.tripType === 'roundtrip' && bookingData.returnDate ? 
          `<tr><td><strong>Return:</strong></td><td>${bookingData.returnDate} at ${bookingData.returnTime}</td></tr>` : ''}
        ${bookingData.flightNumber ? `<tr><td><strong>Flight:</strong></td><td>${bookingData.flightNumber}</td></tr>` : ''}
        <tr><td><strong>Vehicle:</strong></td><td>${bookingData.vehicleDetails.name}</td></tr>
      </table>
    </div>

    ${reviewUrl ? `
    <div class="review-section">
      <h2 style="color: #0369a1; margin-top: 0; font-size: 15px;">Share Your Experience</h2>
      <p>Your feedback helps us improve. <a href="${reviewUrl}">Leave a Review</a></p>
    </div>
    ` : ''}

    <div class="section">
      <p><strong>Thank you for choosing us!</strong> We hope to serve you again soon.</p>
    </div>

    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
      <p>&copy; ${new Date().getFullYear()} Booking Service. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendOrderThankYouEmail(bookingData: BookingData) {
  try {
    // Validate email before sending
    if (!bookingData.email || !isValidEmail(bookingData.email)) {
      console.error("❌ Invalid customer email address:", bookingData.email);
      return false;
    }

    console.log("📧 Preparing thank you email for:", bookingData.email);

    // Get SMTP settings for from address
    await connectDB();
    const settings = await Setting.findOne();
    const fromAddress = settings?.smtpFrom || settings?.smtpUser || "noreply@booking.com";
    const fromField = settings?.smtpSenderName ? `${settings.smtpSenderName} <${fromAddress}>` : fromAddress;

    const htmlContent = generateEmailHTML(bookingData);

    const success = await sendEmail({
      from: fromField,
      to: bookingData.email,
      subject: `Thank You for Your Trip - Reservation #${bookingData.tripId}`,
      html: htmlContent,
      text: `Thank You!\n\nDear ${bookingData.firstName} ${bookingData.lastName},\n\nThank you for choosing our service for Reservation #${bookingData.tripId}.\n\nYour trip details:\nFrom: ${bookingData.pickup}${bookingData.stops && bookingData.stops.length > 0 ? '\nStops: ' + bookingData.stops.map((stop, index) => {
        const durationText = stop.duration && stop.duration > 0 ? ` (Wait: ${stop.duration >= 60 ? `${Math.floor(stop.duration / 60)}h${stop.duration % 60 > 0 ? ` ${stop.duration % 60}m` : ''}` : `${stop.duration}m`})` : '';
        return `Stop ${index + 1}: ${stop.location}${durationText}`;
      }).join(', ') : ''}\nTo: ${bookingData.dropoff}\nDeparture Date: ${bookingData.date} at ${bookingData.time}${bookingData.tripType === 'roundtrip' && bookingData.returnDate ? `\nReturn Date: ${bookingData.returnDate} at ${bookingData.returnTime}` : ''}${bookingData.flightNumber ? `\nFlight Number: ${bookingData.flightNumber}` : ''}\nVehicle: ${bookingData.vehicleDetails.name}\n\nWe hope to serve you again soon!`,
    });

    if (!success) {
      console.error("❌ Failed to send thank you email to:", bookingData.email);
      return false;
    }

    console.log("✅ Thank you email sent to:", bookingData.email);
    return true;
  } catch (error) {
    console.error("❌ Error sending thank you email:", error);
    return false;
  }
}
