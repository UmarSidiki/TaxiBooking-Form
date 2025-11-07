import { sendEmail } from "@/lib/email";
import { connectDB } from "@/lib/mongoose";
import Setting from "@/models/Setting";
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
  paymentMethod?: string;
  paymentStatus?: string;
  flightNumber?: string;
}

// Email validation utility
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generateEmailHTML(bookingData: BookingData, currency: string = 'EUR') {
  const currencySymbol = getCurrencySymbol(currency);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Booking Confirmation - Reservation #${bookingData.tripId}</title>
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
    .payment { background-color: #edf2f7; padding: 15px; border-radius: 5px; }
    .footer { color: #718096; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
    .highlight { color: #2d3748; font-weight: bold; }
    .cta-button { 
      display: inline-block; 
      background-color: #0369a1; 
      color: #ffffff !important; 
      padding: 10px 20px; 
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
      <h1>Booking Confirmed</h1>
      <p>Dear ${bookingData.firstName} ${bookingData.lastName},</p>
      <p>Thank you for choosing our service! Your Reservation has been confirmed.</p>
    </div>

    <div class="section">
      <h2>Journey Details</h2>
      <div class="details">
        <ul>
          <li><span class="highlight">Reservation ID:</span> #${
            bookingData.tripId
          }</li>
          <li><span class="highlight">From:</span> ${bookingData.pickup}</li>
          ${bookingData.stops && bookingData.stops.length > 0 ? bookingData.stops.map((stop, index) => {
            const durationText = stop.duration && stop.duration > 0 
              ? ` (Wait time: ${stop.duration >= 60 ? `${Math.floor(stop.duration / 60)}h${stop.duration % 60 > 0 ? ` ${stop.duration % 60}m` : ''}` : `${stop.duration}m`})`
              : '';
            return `<li><span class="highlight">Stop ${index + 1}:</span> ${stop.location}${durationText}</li>`;
          }).join('') : ''}
          <li><span class="highlight">To:</span> ${bookingData.dropoff}</li>
          <li><span class="highlight">Departure Date:</span> ${bookingData.date}</li>
          <li><span class="highlight">Departure Time:</span> ${bookingData.time}</li>
          ${bookingData.tripType === 'roundtrip' && bookingData.returnDate ? 
            `<li><span class="highlight">Return Date:</span> ${bookingData.returnDate}</li>` : ''}
          ${bookingData.tripType === 'roundtrip' && bookingData.returnTime ? 
            `<li><span class="highlight">Return Time:</span> ${bookingData.returnTime}</li>` : ''}
          <li><span class="highlight">Reservation Type:</span> ${
            bookingData.tripType
          }</li>
          ${
            bookingData.flightNumber
              ? `<li><span class="highlight">Flight Number:</span> ${bookingData.flightNumber}</li>`
              : ""
          }
        </ul>
      </div>
    </div>

    <div class="section">
      <h2>Vehicle & Passengers</h2>
      <div class="details">
        <ul>
          <li><span class="highlight">Vehicle:</span> ${
            bookingData.vehicleDetails.name
          }</li>
          <li><span class="highlight">Max Seats:</span> ${
            bookingData.vehicleDetails.seats
          }</li>
          <li><span class="highlight">Passengers:</span> ${
            bookingData.passengers
          }</li>
          ${
            bookingData.childSeats > 0
              ? `<li><span class="highlight">Child Seats:</span> ${bookingData.childSeats}</li>`
              : ""
          }
          ${
            bookingData.babySeats > 0
              ? `<li><span class="highlight">Baby Seats:</span> ${bookingData.babySeats}</li>`
              : ""
          }
        </ul>
      </div>
    </div>

    ${
      bookingData.notes
        ? `
    <div class="section">
      <h2>Special Requests</h2>
      <div class="details">
        <p>${bookingData.notes}</p>
      </div>
    </div>
    `
        : ""
    }

    <div class="section">
      <h2>Payment Summary</h2>
      <div class="payment">
        <p><span class="highlight">Total Amount: ${currencySymbol}${bookingData.totalAmount.toFixed(
    2
  )}</span></p>
        ${
          bookingData.paymentMethod
            ? `
        <p><span class="highlight">Payment Method:</span> ${bookingData.paymentMethod.replace(
          "_",
          " "
        )}</p>
        <p><span class="highlight">Payment Status:</span> ${
          bookingData.paymentStatus || "Pending"
        }</p>
        `
            : ""
        }
      </div>
    </div>

    <div class="section">
      <p>If you have any questions, please contact us.</p>
      <a href="mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}" class="cta-button">
        <span>Contact Support</span>
      </a>
    </div>

    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
      <p>© ${new Date().getFullYear()} Booking Service. All rights reserved.</p>
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
