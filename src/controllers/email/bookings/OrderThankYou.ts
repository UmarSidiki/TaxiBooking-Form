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
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f0f9ff; padding: 20px; border-radius: 5px; margin-bottom: 20px; text-align: center; }
    .header h1 { margin: 0; color: #0369a1; }
    .section { margin-bottom: 20px; }
    .section h2 { color: #4a5568; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; }
    .details { background-color: #f7fafc; padding: 15px; border-radius: 5px; }
    .details ul { margin: 0; padding-left: 20px; }
    .details li { margin-bottom: 8px; }
    .footer { color: #718096; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
    .highlight { color: #2d3748; font-weight: bold; }
    .cta-section { background-color: #f0f9ff; padding: 20px; border-radius: 5px; margin-top: 20px; text-align: center; }
    .cta-button {
      display: inline-block;
      background-color: #0369a1;
      color: #ffffff !important;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 15px;
      font-weight: bold;
      text-align: center;
    }
    .cta-button span {
      color: #ffffff !important;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Thank You for Choosing Us!</h1>
      <p>Dear ${bookingData.firstName} ${bookingData.lastName},</p>
      <p>We hope you had a great experience with our service!</p>
    </div>

    <div class="section">
      <h2>Your Recent Trip</h2>
      <div class="details">
        <ul>
          <li><span class="highlight">Reservation ID:</span> #${
            bookingData.tripId
          }</li>
          <li><span class="highlight">From:</span> ${bookingData.pickup}</li>
          ${bookingData.stops && bookingData.stops.length > 0 ? bookingData.stops.map((stop, index) =>
            `<li><span class="highlight">Stop ${index + 1}:</span> ${stop.location}</li>`
          ).join('') : ''}
          <li><span class="highlight">To:</span> ${bookingData.dropoff}</li>
          <li><span class="highlight">Departure Date:</span> ${bookingData.date}</li>
          <li><span class="highlight">Departure Time:</span> ${bookingData.time}</li>
          ${bookingData.tripType === 'roundtrip' && bookingData.returnDate ? 
            `<li><span class="highlight">Return Date:</span> ${bookingData.returnDate}</li>` : ''}
          ${bookingData.tripType === 'roundtrip' && bookingData.returnTime ? 
            `<li><span class="highlight">Return Time:</span> ${bookingData.returnTime}</li>` : ''}
          ${
            bookingData.flightNumber
              ? `<li><span class="highlight">Flight Number:</span> ${bookingData.flightNumber}</li>`
              : ""
          }
          <li><span class="highlight">Vehicle:</span> ${
            bookingData.vehicleDetails.name
          }</li>
        </ul>
      </div>
    </div>

    ${reviewUrl ? `
    <div class="cta-section">
      <h2 style="color: #0369a1; margin-top: 0;">How was your experience?</h2>
      <p>We would love to hear about your experience! Your feedback helps us improve our service.</p>
      <a href="${reviewUrl}" class="cta-button">
        <span>Leave a Review</span>
      </a>
    </div>
    ` : ''}

    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
      <p>© ${new Date().getFullYear()} Booking Service. All rights reserved.</p>
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
