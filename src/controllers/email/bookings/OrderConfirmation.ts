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

function generateEmailHTML(bookingData: BookingData, currency: string = "EUR") {
  const currencySymbol = getCurrencySymbol(currency);
  const baseUrl = bookingData.baseUrl || process.env.NEXT_PUBLIC_BASE_URL;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Booking Confirmation - Reservation #${bookingData.tripId}</title>
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
    .payment-section { background-color: #f9f9f9; padding: 10px; border-radius: 3px; }
    .total-row { font-size: 15px; font-weight: bold; color: #0369a1; }
    .footer { font-size: 12px; color: #999; margin-top: 25px; border-top: 1px solid #ddd; padding-top: 15px; }
    a { color: #0369a1; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Booking Confirmed</h1>
      <p>Dear ${bookingData.firstName} ${bookingData.lastName},</p>
      <p>Thank you for your booking. Your reservation has been confirmed.</p>
    </div>

    <div class="section">
      <h2>Reservation Details</h2>
      <table>
        <tr><td><strong>Reservation ID:</strong></td><td>#${bookingData.tripId}</td></tr>
        <tr><td><strong>From:</strong></td><td>${bookingData.pickup}</td></tr>
        ${
          bookingData.stops && bookingData.stops.length > 0
            ? bookingData.stops
                .map((stop, index) => {
                  const durationText =
                    stop.duration && stop.duration > 0
                      ? ` (Wait: ${stop.duration >= 60 ? `${Math.floor(stop.duration / 60)}h${stop.duration % 60 > 0 ? ` ${stop.duration % 60}m` : ""}` : `${stop.duration}m`})`
                      : "";
                  return `<tr><td><strong>Stop ${index + 1}:</strong></td><td>${stop.location}${durationText}</td></tr>`;
                })
                .join("")
            : ""
        }
        <tr><td><strong>To:</strong></td><td>${bookingData.dropoff}</td></tr>
        <tr><td><strong>Departure:</strong></td><td>${bookingData.date} at ${bookingData.time}</td></tr>
        ${
          bookingData.tripType === "roundtrip" && bookingData.returnDate
            ? `<tr><td><strong>Return:</strong></td><td>${bookingData.returnDate} at ${bookingData.returnTime}</td></tr>`
            : ""
        }
        <tr><td><strong>Type:</strong></td><td>${bookingData.tripType}</td></tr>
        ${bookingData.flightNumber ? `<tr><td><strong>Flight:</strong></td><td>${bookingData.flightNumber}</td></tr>` : ""}
      </table>
    </div>

    <div class="section">
      <h2>Vehicle & Passengers</h2>
      <table>
        <tr><td><strong>Vehicle:</strong></td><td>${bookingData.vehicleDetails.name}</td></tr>
        <tr><td><strong>Seats:</strong></td><td>${bookingData.vehicleDetails.seats}</td></tr>
        <tr><td><strong>Passengers:</strong></td><td>${bookingData.passengers}</td></tr>
        ${bookingData.childSeats > 0 ? `<tr><td><strong>Child Seats:</strong></td><td>${bookingData.childSeats}</td></tr>` : ""}
        ${bookingData.babySeats > 0 ? `<tr><td><strong>Baby Seats:</strong></td><td>${bookingData.babySeats}</td></tr>` : ""}
      </table>
    </div>

    ${
      bookingData.notes
        ? `
    <div class="section">
      <h2>Special Requests</h2>
      <p>${bookingData.notes}</p>
    </div>
    `
        : ""
    }

    <div class="section">
      <h2>Payment</h2>
      <div class="payment-section">
        <table>
          ${
            bookingData.taxAmount && bookingData.taxAmount > 0
              ? `
          <tr><td>Subtotal:</td><td>${currencySymbol}${(bookingData.subtotalAmount || bookingData.totalAmount).toFixed(2)}</td></tr>
          <tr><td>Tax (${bookingData.taxPercentage || 0}%)${bookingData.taxIncluded ? " - Included" : ""}:</td><td>${currencySymbol}${bookingData.taxAmount.toFixed(2)}</td></tr>
          <tr class="total-row"><td>Total:</td><td>${currencySymbol}${bookingData.totalAmount.toFixed(2)}</td></tr>
          `
              : `
          <tr class="total-row"><td>Total:</td><td>${currencySymbol}${bookingData.totalAmount.toFixed(2)}</td></tr>
          `
          }
          ${bookingData.paymentMethod ? `<tr><td>Payment Method:</td><td>${bookingData.paymentMethod.replace("_", " ")}</td></tr>` : ""}
          ${bookingData.paymentStatus ? `<tr><td>Payment Status:</td><td>${bookingData.paymentStatus}</td></tr>` : ""}
        </table>
      </div>
    </div>

    <div class="section">
      <p><strong>Need Help?</strong></p>
      <p>Contact us: <a href="mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}">${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}</a></p>
      <p><a href="${baseUrl}/api/invoice/${bookingData.tripId}">View or Download Invoice</a></p>
    </div>

    <div class="footer">
      <p>This is an automated email. Please do not reply to this message.</p>
      <p>&copy; ${new Date().getFullYear()} Booking Service. All rights reserved.</p>
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
    const fromAddress =
      settings?.smtpFrom || settings?.smtpUser || "noreply@booking.com";
    const fromField = settings?.smtpSenderName
      ? `${settings.smtpSenderName} <${fromAddress}>`
      : fromAddress;
    const currency = settings?.stripeCurrency || "EUR";
    const currencySymbol = getCurrencySymbol(currency);

    const htmlContent = generateEmailHTML(bookingData, currency);

    const success = await sendEmail({
      from: fromField,
      to: bookingData.email,
      subject: `Booking Confirmation - Reservation #${bookingData.tripId}`,
      html: htmlContent,
      text: `Booking Confirmed!\n\nReservation ID: ${bookingData.tripId}\nCustomer: ${bookingData.firstName} ${bookingData.lastName}\nFrom: ${bookingData.pickup}${
        bookingData.stops && bookingData.stops.length > 0
          ? "\nStops: " +
            bookingData.stops
              .map((stop, index) => {
                const durationText =
                  stop.duration && stop.duration > 0
                    ? ` (Wait: ${stop.duration >= 60 ? `${Math.floor(stop.duration / 60)}h${stop.duration % 60 > 0 ? ` ${stop.duration % 60}m` : ""}` : `${stop.duration}m`})`
                    : "";
                return `Stop ${index + 1}: ${stop.location}${durationText}`;
              })
              .join(", ")
          : ""
      }\nTo: ${bookingData.dropoff}\nDeparture Date: ${bookingData.date} at ${bookingData.time}${bookingData.tripType === "roundtrip" && bookingData.returnDate ? `\nReturn Date: ${bookingData.returnDate} at ${bookingData.returnTime}` : ""}${bookingData.flightNumber ? `\nFlight Number: ${bookingData.flightNumber}` : ""}\nVehicle: ${bookingData.vehicleDetails.name}\nTotal Amount: ${currencySymbol}${bookingData.totalAmount}`,
    });

    if (!success) {
      console.error(
        "❌ Failed to send confirmation email to:",
        bookingData.email,
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
