import { getCurrencySymbol } from "@/shared/lib/utils";
import type { BookingEmailData } from "@/features/payments/lib/booking-email-data";

function hourly(booking: BookingEmailData) {
  return booking.bookingType === "hourly" || booking.dropoff === "N/A (Hourly booking)";
}

function stopRows(booking: BookingEmailData) {
  if (!booking.stops?.length) return "";
  return booking.stops
    .map((stop, index) => {
      const durationText =
        stop.duration && stop.duration > 0
          ? ` (Wait: ${stop.duration >= 60 ? `${Math.floor(stop.duration / 60)}h${stop.duration % 60 > 0 ? ` ${stop.duration % 60}m` : ""}` : `${stop.duration}m`})`
          : "";
      return `<tr><td><strong>Stop ${index + 1}:</strong></td><td>${stop.location}${durationText}</td></tr>`;
    })
    .join("");
}

export function confirmationEmailHtml(
  booking: BookingEmailData,
  options: {
    currency: string;
    primaryColor: string;
    supportEmail?: string;
    invoiceUrl: string | null;
    invoiceAttached: boolean;
  }
) {
  const symbol = getCurrencySymbol(options.currency);
  const isHourly = hourly(booking);
  const support = options.supportEmail || "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Booking Confirmation - Reservation #${booking.tripId}</title>
</head>
<body style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5;">
  <div style="max-width: 600px; margin: 0 auto;">
    <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid ${options.primaryColor}; margin-bottom: 20px;">
      <h1 style="margin: 0 0 5px 0; font-size: 18px; color: ${options.primaryColor};">Booking Confirmed</h1>
      <p>Dear ${booking.firstName} ${booking.lastName},</p>
      <p>Thank you for your booking. Your reservation has been confirmed.</p>
    </div>
    <h2 style="font-size: 15px; color: ${options.primaryColor};">Reservation Details</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td><strong>Reservation ID:</strong></td><td>#${booking.tripId}</td></tr>
      <tr><td><strong>From:</strong></td><td>${booking.pickup}</td></tr>
      ${stopRows(booking)}
      ${isHourly ? "" : `<tr><td><strong>To:</strong></td><td>${booking.dropoff}</td></tr>`}
      ${isHourly && booking.duration ? `<tr><td><strong>Duration:</strong></td><td>${booking.duration} hours</td></tr>` : ""}
      <tr><td><strong>Departure:</strong></td><td>${booking.date} at ${booking.time}</td></tr>
      ${booking.tripType === "roundtrip" && booking.returnDate ? `<tr><td><strong>Return:</strong></td><td>${booking.returnDate} at ${booking.returnTime}</td></tr>` : ""}
      <tr><td><strong>Type:</strong></td><td>${booking.tripType}</td></tr>
      ${booking.flightNumber ? `<tr><td><strong>Flight:</strong></td><td>${booking.flightNumber}</td></tr>` : ""}
      <tr><td><strong>Vehicle:</strong></td><td>${booking.vehicleDetails.name}</td></tr>
      <tr><td><strong>Seats:</strong></td><td>${booking.vehicleDetails.seats}</td></tr>
      <tr><td><strong>Passengers:</strong></td><td>${booking.passengers}</td></tr>
      ${booking.childSeats > 0 ? `<tr><td><strong>Child Seats:</strong></td><td>${booking.childSeats}</td></tr>` : ""}
      ${booking.babySeats > 0 ? `<tr><td><strong>Baby Seats:</strong></td><td>${booking.babySeats}</td></tr>` : ""}
    </table>
    ${booking.notes ? `<h2 style="font-size: 15px; color: ${options.primaryColor};">Special Requests</h2><p>${booking.notes}</p>` : ""}
    <h2 style="font-size: 15px; color: ${options.primaryColor};">Payment</h2>
    <table style="width: 100%; border-collapse: collapse;">
      ${
        booking.taxAmount && booking.taxAmount > 0
          ? `<tr><td>Subtotal:</td><td>${symbol}${(booking.subtotalAmount || booking.totalAmount).toFixed(2)}</td></tr>
             <tr><td>Tax (${booking.taxPercentage || 0}%)${booking.taxIncluded ? " - Included" : ""}:</td><td>${symbol}${booking.taxAmount.toFixed(2)}</td></tr>`
          : ""
      }
      <tr><td><strong>Total:</strong></td><td><strong>${symbol}${booking.totalAmount.toFixed(2)}</strong></td></tr>
      ${booking.paymentMethod ? `<tr><td>Payment Method:</td><td>${booking.paymentMethod.replaceAll("_", " ")}</td></tr>` : ""}
      ${booking.paymentStatus ? `<tr><td>Payment Status:</td><td>${booking.paymentStatus}</td></tr>` : ""}
    </table>
    ${options.invoiceAttached ? "<p>Your invoice is attached to this email.</p>" : ""}
    ${options.invoiceUrl ? `<p><a href="${options.invoiceUrl}">View or Download Invoice</a></p>` : ""}
    ${support ? `<p>Contact us: <a href="mailto:${support}">${support}</a></p>` : ""}
    <p style="font-size: 12px; color: #999;">This is an automated email. Please do not reply to this message.</p>
  </div>
</body>
</html>`;
}
