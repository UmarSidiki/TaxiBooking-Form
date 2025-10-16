import { sendEmail } from "@/lib/email";
import { getMongoDb } from "@/lib/mongodb";

interface BookingData {
  tripId: string;
  pickup: string;
  dropoff: string;
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
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1>Booking Cancelled</h1>
    <p>Dear ${bookingData.firstName} ${bookingData.lastName},</p>
    <p>Your booking has been cancelled as of ${canceledAt}.</p>

    <h2>Journey Details</h2>
    <ul>
      <li><strong>Trip ID:</strong> #${bookingData.tripId}</li>
      <li><strong>Pickup:</strong> ${bookingData.pickup}</li>
      <li><strong>Dropoff:</strong> ${bookingData.dropoff}</li>
      <li><strong>Date:</strong> ${bookingData.date}</li>
      <li><strong>Time:</strong> ${bookingData.time}</li>
      <li><strong>Vehicle:</strong> ${bookingData.vehicleDetails?.name || bookingData.selectedVehicle}</li>
    </ul>

    <h2>Payment & Refund</h2>
    <ul>
      <li><strong>Total Paid:</strong> ${getCurrencySymbol()}${bookingData.totalAmount.toFixed(2)}</li>
      <li><strong>Refund Amount:</strong> ${getCurrencySymbol()}${refundAmount.toFixed(2)}</li>
      ${refundPercentage !== null ? `<li><strong>Refund Percentage:</strong> ${refundPercentage}%</li>` : ""}
    </ul>

    <p>The refund will be processed back to your original payment method. Depending on your bank, it may take 5-10 business days to appear on your statement.</p>

    <p>If you have any questions, please contact our support team.</p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <p style="color: #666; font-size: 12px;">
      This is an automated message.<br>
      © ${new Date().getFullYear()} Booking Service. All rights reserved.
    </p>
  </div>
</body>
</html>
  `;
}

export async function sendOrderCancellationEmail(bookingData: BookingData) {
  const htmlContent = generateEmailHTML(bookingData);

  const refundAmountText = (bookingData.refundAmount ?? 0).toFixed(2);
  const refundPercentText = bookingData.refundPercentage
    ? `${bookingData.refundPercentage}%`
    : "N/A";

  const success = await sendEmail({
    from: process.env.SMTP_FROM || `"Booking Service" <${process.env.SMTP_USER}>`,
    to: bookingData.email,
    subject: `Booking Cancelled - Trip #${bookingData.tripId}`,
    html: htmlContent,
    text: `Your booking (Trip #${bookingData.tripId}) has been cancelled.

Cancellation Details:
- Pickup: ${bookingData.pickup}
- Dropoff: ${bookingData.dropoff}
- Date: ${bookingData.date} at ${bookingData.time}
- Refund Amount: €${refundAmountText}
- Refund Percentage: ${refundPercentText}

If you have any questions, reply to this email and our team will assist you.`,
  });

  if (!success) return false;

  console.log("✅ Cancellation email sent to:", bookingData.email);

  // Also send notification to admin
  await sendCancellationNotificationToAdmin(bookingData);

  return true;
}

async function sendCancellationNotificationToAdmin(bookingData: BookingData) {
  try {
    // Get admin email from database
    const db = await getMongoDb();
    const usersCollection = db.collection("users");
    const adminUser = await usersCollection.findOne({ role: "admin" });

    const adminEmail = adminUser?.email || process.env.OWNER_EMAIL;

    if (!adminEmail) {
      console.log("⚠️ No admin email found. Admin cancellation notification skipped.");
      return true;
    }

    const refundAmountText = (bookingData.refundAmount ?? 0).toFixed(2);
    const refundPercentText = bookingData.refundPercentage
      ? `${bookingData.refundPercentage}%`
      : "N/A";

    const success = await sendEmail({
      from: process.env.SMTP_FROM || `"Booking System" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `🚫 Booking Cancelled - Trip #${bookingData.tripId}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #dc2626; border-bottom: 3px solid #dc2626; padding-bottom: 10px;">⚠️ Booking Cancellation Alert</h1>
          <p style="font-size: 16px; color: #333;">A booking has been cancelled by the customer.</p>

          <div style="background: #fee; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #dc2626;">Cancellation Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Trip ID:</td>
                <td style="padding: 8px 0;">${bookingData.tripId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Customer:</td>
                <td style="padding: 8px 0;">${bookingData.firstName} ${bookingData.lastName}</td>
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
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Dropoff:</td>
                <td style="padding: 8px 0;">${bookingData.dropoff}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Date & Time:</td>
                <td style="padding: 8px 0;">${bookingData.date} at ${bookingData.time}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Vehicle:</td>
                <td style="padding: 8px 0;">${bookingData.vehicleDetails?.name || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Total Amount:</td>
                <td style="padding: 8px 0; font-size: 18px; color: #dc2626;">€${bookingData.totalAmount.toFixed(2)}</td>
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

          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Please review this cancellation and process the refund if applicable.
          </p>
        </div>
      `,
      text: `Booking Cancellation Alert

Trip ID: ${bookingData.tripId}
Customer: ${bookingData.firstName} ${bookingData.lastName}
Email: ${bookingData.email}
Phone: ${bookingData.phone}
From: ${bookingData.pickup}
To: ${bookingData.dropoff}
Date: ${bookingData.date} at ${bookingData.time}
Vehicle: ${bookingData.vehicleDetails?.name || 'N/A'}
Total Amount: €${bookingData.totalAmount.toFixed(2)}
Refund Amount: €${refundAmountText}
Refund Percentage: ${refundPercentText}

Please review this cancellation and process the refund if applicable.`,
    });

    if (!success) return false;

    console.log("✅ Cancellation notification sent to admin:", adminEmail);
    return true;
  } catch (error) {
    console.error("❌ Error sending admin cancellation notification:", error);
    return false;
  }
}