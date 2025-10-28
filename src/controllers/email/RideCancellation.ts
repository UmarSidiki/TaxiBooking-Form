import { sendEmail } from "@/lib/email";
import { connectDB } from "@/lib/mongoose";
import Setting from "@/models/Setting";
import { getCurrencySymbol } from "@/lib/utils";

interface RideCancellationData {
  tripId: string;
  pickup: string;
  dropoff: string;
  stops: Array<{ location: string; order: number }>;
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
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #fef2f2; padding: 20px; border-radius: 5px; margin-bottom: 20px; text-align: center; }
    .header h1 { margin: 0; color: #dc2626; }
    .section { margin-bottom: 20px; }
    .section h2 { color: #4a5568; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; }
    .details { background-color: #f7fafc; padding: 15px; border-radius: 5px; }
    .details ul { margin: 0; padding-left: 20px; }
    .details li { margin-bottom: 8px; }
    .payment { background-color: #edf2f7; padding: 15px; border-radius: 5px; }
    .footer { color: #718096; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
    .highlight { color: #2d3748; font-weight: bold; }
    .cancellation-notice {
      background-color: #fef2f2;
      border: 1px solid #dc2626;
      border-radius: 5px;
      padding: 15px;
      margin-bottom: 20px;
    }
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
      text: `Ride Assignment Cancelled!\n\nReservation ID: ${cancellationData.tripId}\nCustomer: ${cancellationData.firstName} ${cancellationData.lastName}\nFrom: ${cancellationData.pickup}${cancellationData.stops && cancellationData.stops.length > 0 ? '\nStops: ' + cancellationData.stops.map((stop, index) => `Stop ${index + 1}: ${stop.location}`).join(', ') : ''}\nTo: ${cancellationData.dropoff}\nDeparture Date: ${cancellationData.date} at ${cancellationData.time}${cancellationData.tripType === 'roundtrip' && cancellationData.returnDate ? `\nReturn Date: ${cancellationData.returnDate} at ${cancellationData.returnTime}` : ''}${cancellationData.flightNumber ? `\nFlight Number: ${cancellationData.flightNumber}` : ''}\nVehicle: ${cancellationData.vehicleDetails.name}\nTotal Amount: ${currencySymbol}${cancellationData.totalAmount}\n\nCustomer Contact: ${cancellationData.email} | ${cancellationData.phone}\n\nThis ride has been reassigned to another driver.`,
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