import { sendEmail } from "@/lib/email";
import { connectDB } from "@/lib/database";
import { Setting } from "@/models/settings";
import { getCurrencySymbol } from "@/lib/utils";

interface RideAssignmentData {
  tripId: string;
  pickup: string;
  dropoff: string;
  stops?: Array<{ location: string; order: number; duration?: number }>;
  tripType?: string;
  date: string;
  time: string;
  returnDate?: string;
  returnTime?: string;
  passengers?: number;
  selectedVehicle?: string;
  vehicleDetails?: {
    name: string;
    price: string;
    seats: string;
  };
  childSeats?: number;
  babySeats?: number;
  notes?: string;
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
  // For partner assignments
  vehicleType?: string;
  passengerName?: string;
  passengerPhone?: string;
  baseUrl?: string;
}

// Email validation utility
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generateEmailHTML(assignmentData: RideAssignmentData, currency: string = 'EUR') {
  const currencySymbol = getCurrencySymbol(currency);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ride Assignment - Reservation #${assignmentData.tripId}</title>
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
    .assignment-notice {
      background-color: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 5px;
      padding: 15px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Ride Assignment</h1>
      <p>Dear ${assignmentData.driverName},</p>
      <p>You have been assigned to a new ride!</p>
    </div>

    <div class="assignment-notice">
      <h3 style="margin: 0 0 10px 0; color: #92400e;">Ride Assignment Details</h3>
      <p style="margin: 0; color: #92400e;"><strong>Reservation ID:</strong> #${assignmentData.tripId}</p>
      <p style="margin: 0; color: #92400e;"><strong>Passenger:</strong> ${assignmentData.passengerName || `${assignmentData.firstName} ${assignmentData.lastName}`}</p>
      <p style="margin: 0; color: #92400e;"><strong>Contact:</strong> ${assignmentData.passengerPhone || assignmentData.phone}</p>
    </div>

    <div class="section">
      <h2>Journey Details</h2>
      <div class="details">
        <ul>
          <li><span class="highlight">Reservation ID:</span> #${assignmentData.tripId}</li>
          <li><span class="highlight">From:</span> ${assignmentData.pickup}</li>
          ${assignmentData.stops && assignmentData.stops.length > 0 ? assignmentData.stops.map((stop, index) =>
            `<li><span class="highlight">Stop ${index + 1}:</span> ${stop.location}</li>`
          ).join('') : ''}
          <li><span class="highlight">To:</span> ${assignmentData.dropoff}</li>
          <li><span class="highlight">Departure Date:</span> ${assignmentData.date}</li>
          <li><span class="highlight">Departure Time:</span> ${assignmentData.time}</li>
          ${assignmentData.tripType === 'roundtrip' && assignmentData.returnDate ? 
            `<li><span class="highlight">Return Date:</span> ${assignmentData.returnDate}</li>` : ''}
          ${assignmentData.tripType === 'roundtrip' && assignmentData.returnTime ? 
            `<li><span class="highlight">Return Time:</span> ${assignmentData.returnTime}</li>` : ''}
          <li><span class="highlight">Reservation Type:</span> ${assignmentData.tripType}</li>
          ${
            assignmentData.flightNumber
              ? `<li><span class="highlight">Flight Number:</span> ${assignmentData.flightNumber}</li>`
              : ""
          }
        </ul>
      </div>
    </div>

    <div class="section">
      <h2>Vehicle & Passengers</h2>
      <div class="details">
        <ul>
          <li><span class="highlight">Vehicle:</span> ${assignmentData.vehicleType || assignmentData.vehicleDetails?.name || 'N/A'}</li>
          <li><span class="highlight">Max Seats:</span> ${assignmentData.vehicleDetails?.seats || 'N/A'}</li>
          <li><span class="highlight">Passengers:</span> ${assignmentData.passengers}</li>
          ${
            assignmentData.childSeats && assignmentData.childSeats > 0
              ? `<li><span class="highlight">Child Seats:</span> ${assignmentData.childSeats}</li>`
              : ""
          }
          ${
            assignmentData.babySeats && assignmentData.babySeats > 0
              ? `<li><span class="highlight">Baby Seats:</span> ${assignmentData.babySeats}</li>`
              : ""
          }
        </ul>
      </div>
    </div>

    ${
      assignmentData.notes
        ? `
    <div class="section">
      <h2>Special Requests</h2>
      <div class="details">
        <p>${assignmentData.notes}</p>
      </div>
    </div>
    `
        : ""
    }

    <div class="section">
      <h2>Payment Summary</h2>
      <div class="payment">
        <p><span class="highlight">Total Amount: ${currencySymbol}${assignmentData.totalAmount.toFixed(2)}</span></p>
        ${
          assignmentData.paymentMethod
            ? `
        <p><span class="highlight">Payment Method:</span> ${assignmentData.paymentMethod.replace("_", " ")}</p>
        <p><span class="highlight">Payment Status:</span> ${assignmentData.paymentStatus || "Pending"}</p>
        `
            : ""
        }
      </div>
    </div>

    <div class="section">
      <p>Please contact the passenger directly if you need any clarification about the ride details.</p>
      <p><strong>Passenger Contact:</strong> ${assignmentData.passengerPhone || assignmentData.phone}</p>
      <a href="mailto:${assignmentData.email}" class="cta-button">
        <span>Contact Passenger</span>
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

export async function sendRideAssignmentEmail(assignmentData: RideAssignmentData) {
  try {
    // Validate email before sending
    if (!assignmentData.driverEmail || !isValidEmail(assignmentData.driverEmail)) {
      console.error("❌ Invalid driver email address:", assignmentData.driverEmail);
      return false;
    }

    console.log("📧 Preparing ride assignment email for:", assignmentData.driverEmail);

    // Get SMTP settings for from address
    await connectDB();
    const settings = await Setting.findOne();
    const fromAddress = settings?.smtpFrom || settings?.smtpUser || "noreply@booking.com";
    const fromField = settings?.smtpSenderName ? `${settings.smtpSenderName} <${fromAddress}>` : fromAddress;
    const currency = settings?.stripeCurrency || 'EUR';
    const currencySymbol = getCurrencySymbol(currency);

    const htmlContent = generateEmailHTML(assignmentData, currency);

    const success = await sendEmail({
      from: fromField,
      to: assignmentData.driverEmail,
      subject: `Ride Assignment - Reservation #${assignmentData.tripId}`,
      html: htmlContent,
      text: `Ride Assignment!\n\nReservation ID: ${assignmentData.tripId}\nPassenger: ${assignmentData.passengerName || `${assignmentData.firstName} ${assignmentData.lastName}`}\nFrom: ${assignmentData.pickup}${assignmentData.stops && assignmentData.stops.length > 0 ? '\nStops: ' + assignmentData.stops.map((stop, index) => {
        const durationText = stop.duration && stop.duration > 0 ? ` (Wait: ${stop.duration >= 60 ? `${Math.floor(stop.duration / 60)}h${stop.duration % 60 > 0 ? ` ${stop.duration % 60}m` : ''}` : `${stop.duration}m`})` : '';
        return `Stop ${index + 1}: ${stop.location}${durationText}`;
      }).join(', ') : ''}\nTo: ${assignmentData.dropoff}\nDeparture Date: ${assignmentData.date} at ${assignmentData.time}${assignmentData.tripType === 'roundtrip' && assignmentData.returnDate ? `\nReturn Date: ${assignmentData.returnDate} at ${assignmentData.returnTime}` : ''}${assignmentData.flightNumber ? `\nFlight Number: ${assignmentData.flightNumber}` : ''}\nVehicle: ${assignmentData.vehicleType || assignmentData.vehicleDetails?.name || 'N/A'}\nTotal Amount: ${currencySymbol}${assignmentData.totalAmount}\n\nPassenger Contact: ${assignmentData.passengerPhone || assignmentData.phone}`,
    });

    if (!success) {
      console.error("❌ Failed to send assignment email to:", assignmentData.driverEmail);
      return false;
    }

    console.log("✅ Ride assignment email sent to:", assignmentData.driverEmail);
    return true;
  } catch (error) {
    console.error("❌ Error sending ride assignment email:", error);
    return false;
  }
}