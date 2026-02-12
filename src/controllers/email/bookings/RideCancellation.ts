import { sendEmail } from "@/lib/email";
import { connectDB } from "@/lib/database";
import { Setting } from "@/models/settings";
import { getCurrencySymbol } from "@/lib/utils";

interface RideCancellationData {
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
  driverName: string;
  driverEmail: string;
}

// Email validation utility
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generateEmailHTML(cancellationData: RideCancellationData, currency: string = 'EUR') {
  const currencySymbol = getCurrencySymbol(currency);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ride Assignment Cancelled - Reservation #${cancellationData.tripId}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background-color: #f5f5f5; padding: 15px; border-left: 4px solid #dc2626; margin-bottom: 20px; }
    .header h1 { margin: 0 0 5px 0; font-size: 18px; color: #dc2626; }
    .section { margin-bottom: 20px; }
    .section h2 { font-size: 15px; color: #dc2626; margin: 15px 0 8px 0; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; }
    .cancellation-notice { background-color: #f9f9f9; padding: 10px; border-radius: 3px; border-left: 3px solid #dc2626; margin-bottom: 15px; }
    .cancellation-notice h3 { margin: 0 0 8px 0; font-size: 14px; color: #dc2626; }
    .cancellation-notice p { margin: 3px 0; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; }
    tr { border-bottom: 1px solid #f0f0f0; }
    td { padding: 6px 0; font-size: 13px; }
    td:first-child { width: 40%; color: #666; }
    .footer { font-size: 12px; color: #999; margin-top: 25px; border-top: 1px solid #ddd; padding-top: 15px; }
    a { color: #dc2626; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Ride Assignment Cancelled</h1>
      <p>Dear ${cancellationData.driverName},</p>
      <p>Your ride assignment has been cancelled.</p>
    </div>

    <div class="cancellation-notice">
      <h3 style="margin: 0 0 10px 0; color: #dc2626;">Assignment Cancellation Details</h3>
      <p style="margin: 0; color: #dc2626;"><strong>Reservation ID:</strong> #${cancellationData.tripId}</p>
      <p style="margin: 0; color: #dc2626;"><strong>Customer:</strong> ${cancellationData.firstName} ${cancellationData.lastName}</p>
      <p style="margin: 0; color: #dc2626;"><strong>Contact:</strong> ${cancellationData.email} | ${cancellationData.phone}</p>
    </div>

    <div class="section">
      <h2>Journey Details</h2>
      <div class="details">
        <ul>
          <li><span class="highlight">Reservation ID:</span> #${cancellationData.tripId}</li>
          <li><span class="highlight">From:</span> ${cancellationData.pickup}</li>
          ${cancellationData.stops && cancellationData.stops.length > 0 ? cancellationData.stops.map((stop, index) =>
            `<li><span class="highlight">Stop ${index + 1}:</span> ${stop.location}</li>`
          ).join('') : ''}
          <li><span class="highlight">To:</span> ${cancellationData.dropoff}</li>
          <li><span class="highlight">Departure Date:</span> ${cancellationData.date}</li>
          <li><span class="highlight">Departure Time:</span> ${cancellationData.time}</li>
          ${cancellationData.tripType === 'roundtrip' && cancellationData.returnDate ? 
            `<li><span class="highlight">Return Date:</span> ${cancellationData.returnDate}</li>` : ''}
          ${cancellationData.tripType === 'roundtrip' && cancellationData.returnTime ? 
            `<li><span class="highlight">Return Time:</span> ${cancellationData.returnTime}</li>` : ''}
          <li><span class="highlight">Reservation Type:</span> ${cancellationData.tripType}</li>
          ${
            cancellationData.flightNumber
              ? `<li><span class="highlight">Flight Number:</span> ${cancellationData.flightNumber}</li>`
              : ""
          }
        </ul>
      </div>
    </div>

    <div class="section">
      <h2>Vehicle & Passengers</h2>
      <div class="details">
        <ul>
          <li><span class="highlight">Vehicle:</span> ${cancellationData.vehicleDetails.name}</li>
          <li><span class="highlight">Max Seats:</span> ${cancellationData.vehicleDetails.seats}</li>
          <li><span class="highlight">Passengers:</span> ${cancellationData.passengers}</li>
          ${
            cancellationData.childSeats > 0
              ? `<li><span class="highlight">Child Seats:</span> ${cancellationData.childSeats}</li>`
              : ""
          }
          ${
            cancellationData.babySeats > 0
              ? `<li><span class="highlight">Baby Seats:</span> ${cancellationData.babySeats}</li>`
              : ""
          }
        </ul>
      </div>
    </div>

    ${
      cancellationData.notes
        ? `
    <div class="section">
      <h2>Special Requests</h2>
      <div class="details">
        <p>${cancellationData.notes}</p>
      </div>
    </div>
    `
        : ""
    }

    <div class="section">
      <h2>Payment Summary</h2>
      <div class="payment">
        <p><span class="highlight">Total Amount: ${currencySymbol}${cancellationData.totalAmount.toFixed(2)}</span></p>
        ${
          cancellationData.paymentMethod
            ? `
        <p><span class="highlight">Payment Method:</span> ${cancellationData.paymentMethod.replace("_", " ")}</p>
        <p><span class="highlight">Payment Status:</span> ${cancellationData.paymentStatus || "Pending"}</p>
        `
            : ""
        }
      </div>
    </div>

    <div class="section">
      <p>This ride has been reassigned to another driver. If you have any questions, please contact support.</p>
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

export async function sendRideCancellationEmail(cancellationData: RideCancellationData) {
  try {
    // Validate email before sending
    if (!cancellationData.driverEmail || !isValidEmail(cancellationData.driverEmail)) {
      console.error("❌ Invalid driver email address:", cancellationData.driverEmail);
      return false;
    }

    console.log("📧 Preparing ride cancellation email for:", cancellationData.driverEmail);

    // Get SMTP settings for from address
    await connectDB();
    const settings = await Setting.findOne();
    const fromAddress = settings?.smtpFrom || settings?.smtpUser || "noreply@booking.com";
    const fromField = settings?.smtpSenderName ? `${settings.smtpSenderName} <${fromAddress}>` : fromAddress;
    const currency = settings?.stripeCurrency || 'EUR';
    const currencySymbol = getCurrencySymbol(currency);

    const htmlContent = generateEmailHTML(cancellationData, currency);

    const success = await sendEmail({
      from: fromField,
      to: cancellationData.driverEmail,
      subject: `Ride Assignment Cancelled - Reservation #${cancellationData.tripId}`,
      html: htmlContent,
      text: `Ride Assignment Cancelled!\n\nReservation ID: ${cancellationData.tripId}\nCustomer: ${cancellationData.firstName} ${cancellationData.lastName}\nFrom: ${cancellationData.pickup}${cancellationData.stops && cancellationData.stops.length > 0 ? '\nStops: ' + cancellationData.stops.map((stop, index) => {
        const durationText = stop.duration && stop.duration > 0 ? ` (Wait: ${stop.duration >= 60 ? `${Math.floor(stop.duration / 60)}h${stop.duration % 60 > 0 ? ` ${stop.duration % 60}m` : ''}` : `${stop.duration}m`})` : '';
        return `Stop ${index + 1}: ${stop.location}${durationText}`;
      }).join(', ') : ''}\nTo: ${cancellationData.dropoff}\nDeparture Date: ${cancellationData.date} at ${cancellationData.time}${cancellationData.tripType === 'roundtrip' && cancellationData.returnDate ? `\nReturn Date: ${cancellationData.returnDate} at ${cancellationData.returnTime}` : ''}${cancellationData.flightNumber ? `\nFlight Number: ${cancellationData.flightNumber}` : ''}\nVehicle: ${cancellationData.vehicleDetails.name}\nTotal Amount: ${currencySymbol}${cancellationData.totalAmount}\n\nCustomer Contact: ${cancellationData.email} | ${cancellationData.phone}\n\nThis ride has been reassigned to another driver.`,
    });

    if (!success) {
      console.error("❌ Failed to send cancellation email to:", cancellationData.driverEmail);
      return false;
    }

    console.log("✅ Ride cancellation email sent to:", cancellationData.driverEmail);
    return true;
  } catch (error) {
    console.error("❌ Error sending ride cancellation email:", error);
    return false;
  }
}