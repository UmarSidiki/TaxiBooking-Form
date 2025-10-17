import { sendEmail } from "@/lib/email";
import { getMongoDb } from "@/lib/mongodb";

interface BookingData {
  tripId: string;
  pickup: string;
  dropoff: string;
  stops: Array<{ location: string; order: number }>;
  tripType: string;
  date: string;
  time: string;
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

function generateEmailHTML(bookingData: BookingData) {
  const getCurrencySymbol = () => "€";
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
    .refund { background-color: #f0fdf4; padding: 15px; border-radius: 5px; border-left: 4px solid #16a34a; }
    .footer { color: #718096; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
    .highlight { color: #2d3748; font-weight: bold; }
    .cta-button { display: inline-block; background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Booking Cancelled</h1>
      <p>Dear ${bookingData.firstName} ${bookingData.lastName},</p>
      <p>Your booking has been cancelled as of ${canceledAt}.</p>
    </div>

    <div class="section">
      <h2>Journey Details</h2>
      <div class="details">
        <ul>
          <li><span class="highlight">Reservation ID:</span> #${
            bookingData.tripId
          }</li>
          <li><span class="highlight">Pickup:</span> ${bookingData.pickup}</li>
          ${bookingData.stops && bookingData.stops.length > 0 ? bookingData.stops.map((stop, index) =>
            `<li><span class="highlight">Stop ${index + 1}:</span> ${stop.location}</li>`
          ).join('') : ''}
          <li><span class="highlight">Dropoff:</span> ${
            bookingData.dropoff
          }</li>
          <li><span class="highlight">Date:</span> ${bookingData.date}</li>
          <li><span class="highlight">Time:</span> ${bookingData.time}</li>
          ${
            bookingData.flightNumber
              ? `<li><span class="highlight">Flight Number:</span> ${bookingData.flightNumber}</li>`
              : ""
          }
          <li><span class="highlight">Vehicle:</span> ${
            bookingData.vehicleDetails?.name || bookingData.selectedVehicle
          }</li>
        </ul>
      </div>
    </div>

    <div class="section">
      <h2>Payment & Refund</h2>
      <div class="payment">
        <ul>
          <li><span class="highlight">Total Paid:</span> ${getCurrencySymbol()}${bookingData.totalAmount.toFixed(
    2
  )}</li>
          <li><span class="highlight">Refund Amount:</span> ${getCurrencySymbol()}${refundAmount.toFixed(
    2
  )}</li>
          ${
            refundPercentage !== null
              ? `<li><span class="highlight">Refund Percentage:</span> ${refundPercentage}%</li>`
              : ""
          }
        </ul>
      </div>
      <div class="refund">
        <p>The refund will be processed back to your original payment method. Depending on your bank, it may take 5-10 business days to appear on your statement.</p>
      </div>
    </div>

    <div class="section">
      <p>If you have any questions, please contact our support team.</p>
      <a href="mailto:support@example.com" class="cta-button">Contact Support</a>
    </div>

    <div class="footer">
      <p>This is an automated message.</p>
      <p>© ${new Date().getFullYear()} Booking Service. All rights reserved.</p>
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

    const htmlContent = generateEmailHTML(bookingData);

    const refundAmountText = (bookingData.refundAmount ?? 0).toFixed(2);
    const refundPercentText = bookingData.refundPercentage
      ? `${bookingData.refundPercentage}%`
      : "N/A";

    const success = await sendEmail({
      from:
        process.env.SMTP_FROM || `"Booking Service" <${process.env.SMTP_USER}>`,
      to: bookingData.email,
      subject: `Booking Cancelled - Reservation #${bookingData.tripId}`,
      html: htmlContent,
      text: `Your booking (Reservation #${bookingData.tripId}) has been cancelled.

Cancellation Details:
- Pickup: ${bookingData.pickup}${bookingData.stops && bookingData.stops.length > 0 ? '\n- Stops: ' + bookingData.stops.map((stop, index) => `Stop ${index + 1}: ${stop.location}`).join(', ') : ''}
- Dropoff: ${bookingData.dropoff}
- Date: ${bookingData.date} at ${bookingData.time}${bookingData.flightNumber ? `\n- Flight Number: ${bookingData.flightNumber}` : ''}
- Refund Amount: €${refundAmountText}
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
    // Get admin email from database
    const db = await getMongoDb();
    const usersCollection = db.collection("users");
    const adminUser = await usersCollection.findOne({ role: "admin" });

    const adminEmail = adminUser?.email || process.env.OWNER_EMAIL;

    if (!adminEmail) {
      console.log(
        "⚠️ No admin email found. Admin cancellation notification skipped."
      );
      return true;
    }

    const refundAmountText = (bookingData.refundAmount ?? 0).toFixed(2);
    const refundPercentText = bookingData.refundPercentage
      ? `${bookingData.refundPercentage}%`
      : "N/A";

    const success = await sendEmail({
      from:
        process.env.SMTP_FROM || `"Booking System" <${process.env.SMTP_USER}>`,
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
                <td style="padding: 8px 0; font-weight: bold;">Date & Time:</td>
                <td style="padding: 8px 0;">${bookingData.date} at ${
        bookingData.time
      }</td>
              </tr>
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
                <td style="padding: 8px 0; font-size: 18px; color: #dc2626;">€${bookingData.totalAmount.toFixed(
                  2
                )}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Refund Amount:</td>
                <td style="padding: 8px 0; font-size: 18px; color: #16a34a;">€${refundAmountText}</td>
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
From: ${bookingData.pickup}${bookingData.stops && bookingData.stops.length > 0 ? '\nStops: ' + bookingData.stops.map((stop, index) => `Stop ${index + 1}: ${stop.location}`).join(', ') : ''}
To: ${bookingData.dropoff}
Date: ${bookingData.date} at ${bookingData.time}${bookingData.flightNumber ? `\nFlight Number: ${bookingData.flightNumber}` : ''}
Vehicle: ${bookingData.vehicleDetails?.name || "N/A"}
Total Amount: €${bookingData.totalAmount.toFixed(2)}
Refund Amount: €${refundAmountText}
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
