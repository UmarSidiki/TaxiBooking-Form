import { sendEmail } from "@/lib/email";
import { getMongoDb } from "@/lib/database/mongodb";
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
  vehicleDetails?: {
    name?: string;
    price?: string;
    seats?: string;
  };
  childSeats: number;
  babySeats: number;
  notes?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  totalAmount: number;
  refundAmount?: number;
  refundPercentage?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  canceledAt?: Date | string | null;
  flightNumber?: string;
}

// Email validation utility
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generateEmailHTML(bookingData: BookingData, currency: string = 'EUR') {
  const currencySymbol = getCurrencySymbol(currency);
  const refundAmount = bookingData.refundAmount ?? 0;
  const refundPercentage = bookingData.refundPercentage ?? null;
  const canceledAt = bookingData.canceledAt
    ? new Date(bookingData.canceledAt).toLocaleString()
    : new Date().toLocaleString();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Booking Cancellation</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background-color: #f5f5f5; padding: 15px; border-left: 4px solid #dc2626; margin-bottom: 20px; }
    .header h1 { margin: 0 0 5px 0; font-size: 18px; color: #dc2626; }
    .section { margin-bottom: 20px; }
    .section h2 { font-size: 15px; color: #dc2626; margin: 15px 0 8px 0; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; }
    tr { border-bottom: 1px solid #f0f0f0; }
    td { padding: 8px 0; }
    td:first-child { width: 40%; color: #666; }
    .refund-section { background-color: #f9f9f9; padding: 10px; border-radius: 3px; border-left: 3px solid #16a34a; }
    .footer { font-size: 12px; color: #999; margin-top: 25px; border-top: 1px solid #ddd; padding-top: 15px; }
    a { color: #dc2626; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Booking Cancelled</h1>
      <p>Dear ${bookingData.firstName} ${bookingData.lastName},</p>
      <p>Your booking has been cancelled as of ${canceledAt}.</p>
    </div>

    <div class="section">
      <h2>Journey Details</h2>
      <table>
        <tr><td><strong>Reservation ID:</strong></td><td>#${bookingData.tripId}</td></tr>
        <tr><td><strong>From:</strong></td><td>${bookingData.pickup}</td></tr>
        ${bookingData.stops && bookingData.stops.length > 0 ? bookingData.stops.map((stop, index) =>
          `<tr><td><strong>Stop ${index + 1}:</strong></td><td>${stop.location}</td></tr>`
        ).join('') : ''}
        <tr><td><strong>To:</strong></td><td>${bookingData.dropoff}</td></tr>
        <tr><td><strong>Departure:</strong></td><td>${bookingData.date} at ${bookingData.time}</td></tr>
        ${bookingData.tripType === 'roundtrip' && bookingData.returnDate ? 
          `<tr><td><strong>Return:</strong></td><td>${bookingData.returnDate} at ${bookingData.returnTime}</td></tr>` : ''}
        <tr><td><strong>Type:</strong></td><td>${bookingData.tripType}</td></tr>
        ${bookingData.flightNumber ? `<tr><td><strong>Flight:</strong></td><td>${bookingData.flightNumber}</td></tr>` : ''}
        <tr><td><strong>Vehicle:</strong></td><td>${bookingData.vehicleDetails?.name || bookingData.selectedVehicle}</td></tr>
      </table>
    </div>

    <div class="section">
      <h2>Refund Details</h2>
      <div class="refund-section">
        <table>
          <tr><td>Total Paid:</td><td>${currencySymbol}${bookingData.totalAmount.toFixed(2)}</td></tr>
          <tr><td>Refund Amount:</td><td>${currencySymbol}${refundAmount.toFixed(2)}</td></tr>
          ${refundPercentage !== null ? `<tr><td>Refund Percentage:</td><td>${refundPercentage}%</td></tr>` : ''}
        </table>
        <p style="font-size: 12px; margin-top: 10px; color: #666;">The refund will be processed back to your original payment method. It may take 5-10 business days to appear.</p>
      </div>
    </div>

    <div class="section">
      <p><strong>Need Help?</strong></p>
      <p>Contact us: <a href="mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}">${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}</a></p>
    </div>

    <div class="footer">
      <p>This is an automated message. Please do not reply.</p>
      <p>&copy; ${new Date().getFullYear()} Booking Service. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendOrderCancellationEmail(bookingData: BookingData) {
  try {
    // Validate email before sending
    if (!bookingData.email || !isValidEmail(bookingData.email)) {
      console.error("❌ Invalid customer email address:", bookingData.email);
      return false;
    }

    console.log("📧 Preparing cancellation email for:", bookingData.email);

    // Get SMTP settings for from address
    await connectDB();
    const settings = await Setting.findOne();
    const fromAddress = settings?.smtpFrom || settings?.smtpUser || "noreply@booking.com";
    const fromField = settings?.smtpSenderName ? `${settings.smtpSenderName} <${fromAddress}>` : fromAddress;
    const currency = settings?.stripeCurrency || 'EUR';
    const currencySymbol = getCurrencySymbol(currency);

    const htmlContent = generateEmailHTML(bookingData, currency);

    const refundAmountText = (bookingData.refundAmount ?? 0).toFixed(2);
    const refundPercentText = bookingData.refundPercentage
      ? `${bookingData.refundPercentage}%`
      : "N/A";

    const success = await sendEmail({
      from: fromField,
      to: bookingData.email,
      subject: `Booking Cancelled - Reservation #${bookingData.tripId}`,
      html: htmlContent,
      text: `Your booking (Reservation #${bookingData.tripId}) has been cancelled.

Cancellation Details:
- Pickup: ${bookingData.pickup}${bookingData.stops && bookingData.stops.length > 0 ? '\n- Stops: ' + bookingData.stops.map((stop, index) => {
  const durationText = stop.duration && stop.duration > 0 ? ` (Wait: ${stop.duration >= 60 ? `${Math.floor(stop.duration / 60)}h${stop.duration % 60 > 0 ? ` ${stop.duration % 60}m` : ''}` : `${stop.duration}m`})` : '';
  return `Stop ${index + 1}: ${stop.location}${durationText}`;
}).join(', ') : ''}
- Dropoff: ${bookingData.dropoff}
- Departure Date: ${bookingData.date} at ${bookingData.time}${bookingData.tripType === 'roundtrip' && bookingData.returnDate ? `\n- Return Date: ${bookingData.returnDate} at ${bookingData.returnTime}` : ''}${bookingData.flightNumber ? `\n- Flight Number: ${bookingData.flightNumber}` : ''}
- Refund Amount: ${currencySymbol}${refundAmountText}
- Refund Percentage: ${refundPercentText}

If you have any questions, reply to this email and our team will assist you.`,
    });

    if (!success) {
      console.error(
        "❌ Failed to send cancellation email to:",
        bookingData.email
      );
      return false;
    }

    console.log("✅ Cancellation email sent to:", bookingData.email);

    // Also send notification to admin
    await sendCancellationNotificationToAdmin(bookingData);

    return true;
  } catch (error) {
    console.error("❌ Error sending cancellation email:", error);
    return false;
  }
}

async function sendCancellationNotificationToAdmin(bookingData: BookingData) {
  try {
    // Get admin/owner email from database only
    const db = await getMongoDb();
    const usersCollection = db.collection("users");
    const adminUser = await usersCollection.findOne({ role: { $in: ["owner", "admin", "superadmin"] } });

    const adminEmail = adminUser?.email;

    const isEmailValid = (email?: string) =>
      typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!adminEmail || !isEmailValid(adminEmail)) {
      console.log(
        "⚠️ No valid owner/admin user found in database. Admin cancellation notification skipped."
      );
      return true;
    }

    console.log("📧 Sending cancellation notification to admin:", adminEmail);

    // Get SMTP settings for from address (reuse from parent function if available, otherwise fetch again)
    const settings = await Setting.findOne();
    const fromAddressAdmin = settings?.smtpFrom || settings?.smtpUser || "noreply@booking.com";
    const fromFieldAdmin = settings?.smtpSenderName ? `${settings.smtpSenderName} <${fromAddressAdmin}>` : fromAddressAdmin;
    const currency = settings?.stripeCurrency || 'EUR';
    const currencySymbol = getCurrencySymbol(currency);

    const refundAmountText = (bookingData.refundAmount ?? 0).toFixed(2);
    const refundPercentText = bookingData.refundPercentage
      ? `${bookingData.refundPercentage}%`
      : "N/A";

    const success = await sendEmail({
      from: fromFieldAdmin,
      to: adminEmail,
      subject: `Booking Cancelled - Reservation #${bookingData.tripId}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #fef2f2; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="margin: 0; color: #dc2626;">⚠️ Booking Cancellation Alert</h1>
            <p style="font-size: 16px; color: #333;">A booking has been cancelled by the customer.</p>
          </div>

          <div style="background: #fee; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #dc2626;">Cancellation Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Reservation ID:</td>
                <td style="padding: 8px 0;">${bookingData.tripId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Customer:</td>
                <td style="padding: 8px 0;">${bookingData.firstName} ${
        bookingData.lastName
      }</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Email:</td>
                <td style="padding: 8px 0;">${bookingData.email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Phone:</td>
                <td style="padding: 8px 0;">${bookingData.phone}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Pickup:</td>
                <td style="padding: 8px 0;">${bookingData.pickup}</td>
              </tr>
              ${bookingData.stops && bookingData.stops.length > 0 ? bookingData.stops.map((stop, index) =>
                `<tr>
                  <td style="padding: 8px 0; font-weight: bold;">Stop ${index + 1}:</td>
                  <td style="padding: 8px 0;">${stop.location}</td>
                </tr>`
              ).join('') : ''}
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Dropoff:</td>
                <td style="padding: 8px 0;">${bookingData.dropoff}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Departure Date & Time:</td>
                <td style="padding: 8px 0;">${bookingData.date} at ${
        bookingData.time
      }</td>
              </tr>
              ${bookingData.tripType === 'roundtrip' && bookingData.returnDate ? `<tr>
                <td style="padding: 8px 0; font-weight: bold;">Return Date & Time:</td>
                <td style="padding: 8px 0;">${bookingData.returnDate} at ${bookingData.returnTime}</td>
              </tr>` : ''}
              ${bookingData.flightNumber ? `<tr>
                <td style="padding: 8px 0; font-weight: bold;">Flight Number:</td>
                <td style="padding: 8px 0;">${bookingData.flightNumber}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Vehicle:</td>
                <td style="padding: 8px 0;">${
                  bookingData.vehicleDetails?.name || "N/A"
                }</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Total Amount:</td>
                <td style="padding: 8px 0; font-size: 18px; color: #dc2626;">${currencySymbol}${bookingData.totalAmount.toFixed(
                  2
                )}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Refund Amount:</td>
                <td style="padding: 8px 0; font-size: 18px; color: #16a34a;">${currencySymbol}${refundAmountText}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Refund Percentage:</td>
                <td style="padding: 8px 0;">${refundPercentText}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #f0f9ff; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <p style="color: #666; font-size: 14px; margin: 0;">
              Please review this cancellation and process the refund if applicable.
            </p>
          </div>
        </div>
      `,
      text: `Booking Cancellation Alert

Reservation ID: ${bookingData.tripId}
Customer: ${bookingData.firstName} ${bookingData.lastName}
Email: ${bookingData.email}
Phone: ${bookingData.phone}
From: ${bookingData.pickup}${bookingData.stops && bookingData.stops.length > 0 ? '\nStops: ' + bookingData.stops.map((stop, index) => {
  const durationText = stop.duration && stop.duration > 0 ? ` (Wait: ${stop.duration >= 60 ? `${Math.floor(stop.duration / 60)}h${stop.duration % 60 > 0 ? ` ${stop.duration % 60}m` : ''}` : `${stop.duration}m`})` : '';
  return `Stop ${index + 1}: ${stop.location}${durationText}`;
}).join(', ') : ''}
To: ${bookingData.dropoff}
Departure Date: ${bookingData.date} at ${bookingData.time}${bookingData.tripType === 'roundtrip' && bookingData.returnDate ? `\nReturn Date: ${bookingData.returnDate} at ${bookingData.returnTime}` : ''}${bookingData.flightNumber ? `\nFlight Number: ${bookingData.flightNumber}` : ''}
Vehicle: ${bookingData.vehicleDetails?.name || "N/A"}
Total Amount: ${currencySymbol}${bookingData.totalAmount.toFixed(2)}
Refund Amount: ${currencySymbol}${refundAmountText}
Refund Percentage: ${refundPercentText}

Please review this cancellation and process the refund if applicable.`,
    });

    if (!success) {
      console.error(
        "❌ Failed to send cancellation notification to admin:",
        adminEmail
      );
      return false;
    }

    console.log("✅ Cancellation notification sent to admin:", adminEmail);
    return true;
  } catch (error) {
    console.error("❌ Error sending admin cancellation notification:", error);
    return false;
  }
}
