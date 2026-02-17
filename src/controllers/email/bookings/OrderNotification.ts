import { sendEmail } from '@/lib/email';
import { connectDB } from '@/lib/database';
import { Setting } from '@/models/settings';
import { User, type IUser } from '@/models/user';
import { getCurrencySymbol } from '@/lib/utils';

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

function generateOwnerEmailHTML(bookingData: BookingData, currency: string = 'EUR', primaryColor: string = '#EAB308', baseUrl?: string, enableDrivers?: boolean, enablePartners?: boolean, bookingId?: string) {
  const currencySymbol = getCurrencySymbol(currency);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>New Booking Alert - Reservation #${bookingData.tripId}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background-color: #f5f5f5; padding: 15px; border-left: 4px solid ${primaryColor}; margin-bottom: 20px; }
    .header h1 { margin: 0 0 5px 0; font-size: 18px; color: ${primaryColor}; }
    .section { margin-bottom: 20px; }
    .section h2 { font-size: 15px; color: ${primaryColor}; margin: 15px 0 8px 0; border-bottom: 1px solid #e0e0e0; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; }
    tr { border-bottom: 1px solid #f0f0f0; }
    td { padding: 8px 0; }
    td:first-child { width: 40%; color: #666; }
    .payment-section { background-color: #f9f9f9; padding: 10px; border-radius: 3px; }
    .footer { font-size: 12px; color: #999; margin-top: 25px; border-top: 1px solid #ddd; padding-top: 15px; }
    .action-buttons { margin: 20px 0; text-align: center; }
    .btn { display: inline-block; padding: 12px 24px; margin: 0 5px; text-decoration: none; border-radius: 5px; font-weight: bold; color: white; }
    .btn-driver { background-color: ${primaryColor}; }
    .btn-partner { background-color: #3b82f6; }
    a { color: ${primaryColor}; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Booking Received</h1>
      <p>A new booking request needs your attention.</p>
    </div>

    <div class="section">
      <h2>Customer Details</h2>
      <table>
        <tr><td><strong>Name:</strong></td><td>${bookingData.firstName} ${bookingData.lastName}</td></tr>
        <tr><td><strong>Email:</strong></td><td><a href="mailto:${bookingData.email}">${bookingData.email}</a></td></tr>
        <tr><td><strong>Phone:</strong></td><td><a href="tel:${bookingData.phone}">${bookingData.phone}</a></td></tr>
      </table>
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
        <tr><td><strong>Vehicle:</strong></td><td>${bookingData.vehicleDetails.name}</td></tr>
        <tr><td><strong>Passengers:</strong></td><td>${bookingData.passengers}</td></tr>
        ${bookingData.childSeats > 0 ? `<tr><td>Child Seats:</td><td>${bookingData.childSeats}</td></tr>` : ''}
        ${bookingData.babySeats > 0 ? `<tr><td>Baby Seats:</td><td>${bookingData.babySeats}</td></tr>` : ''}
      </table>
    </div>

    ${bookingData.notes ? `
    <div class="section">
      <h2>Special Requests</h2>
      <p>${bookingData.notes}</p>
    </div>
    ` : ''}

    <div class="section">
      <h2>Payment</h2>
      <div class="payment-section">
        <table>
          ${bookingData.taxAmount && bookingData.taxAmount > 0 ? `
          <tr><td>Subtotal:</td><td>${currencySymbol}${(bookingData.subtotalAmount || bookingData.totalAmount).toFixed(2)}</td></tr>
          <tr><td>Tax (${bookingData.taxPercentage || 0}%)${bookingData.taxIncluded ? ' - Included' : ''}:</td><td>${currencySymbol}${bookingData.taxAmount.toFixed(2)}</td></tr>
          <tr><td><strong>Total:</strong></td><td><strong>${currencySymbol}${bookingData.totalAmount.toFixed(2)}</strong></td></tr>
          ` : `
          <tr><td><strong>Total:</strong></td><td><strong>${currencySymbol}${bookingData.totalAmount.toFixed(2)}</strong></td></tr>
          `}
          ${bookingData.paymentMethod ? `<tr><td>Payment Method:</td><td>${bookingData.paymentMethod.replace('_', ' ')}</td></tr>` : ''}
          ${bookingData.paymentStatus ? `<tr><td>Status:</td><td>${bookingData.paymentStatus}</td></tr>` : ''}
        </table>
      </div>
    </div>

    <div class="section">
      <p>Please review and confirm this booking details with the customer.</p>
    </div>

    ${(enableDrivers || enablePartners) && baseUrl && bookingId ? `
    <div class="action-buttons">
      <p style="margin-bottom: 15px; font-weight: bold;">Assign this booking:</p>
      ${enableDrivers ? `<a href="${baseUrl}/dashboard/rides" class="btn btn-driver">Assign to Driver</a>` : ''}
      ${enablePartners ? `<a href="${baseUrl}/dashboard/rides" class="btn btn-partner">Assign to Partner</a>` : ''}
    </div>
    ` : ''}

    <div class="footer">
      <p>This is an automated notification. Please do not reply.</p>
      <p>&copy; ${new Date().getFullYear()} Booking Service. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendOrderNotificationEmail(bookingData: BookingData) {
  try {
    // Get owner email from database (use Mongoose User model)
    await connectDB();
    const ownerUser = (await User.findOne({ role: { $in: ["owner", "admin", "superadmin"] } }).lean()) as IUser | null;
    const ownerEmail = ownerUser?.email;

    // Validate owner email
    const isEmailValid = (email?: string) =>
      typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!ownerEmail || !isEmailValid(ownerEmail)) {
      console.log(
        "⚠️ No valid owner/admin user found in database. Owner notification skipped."
      );
      return true;
    }

    console.log("📧 Sending owner notification to:", ownerEmail);

    // Get SMTP settings for from address
    await connectDB();
    const settings = await Setting.findOne();
    const fromAddress = settings?.smtpFrom || settings?.smtpUser || "noreply@booking.com";
    const fromField = settings?.smtpSenderName ? `${settings.smtpSenderName} <${fromAddress}>` : fromAddress;
    const currency = settings?.stripeCurrency || 'EUR';
    const currencySymbol = getCurrencySymbol(currency);
    const primaryColor = settings?.primaryColor || '#EAB308';
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || bookingData.baseUrl;
    const enableDrivers = settings?.enableDrivers || false;
    const enablePartners = settings?.enablePartners || false;

    const htmlContent = generateOwnerEmailHTML(bookingData, currency, primaryColor, baseUrl, enableDrivers, enablePartners);

    const success = await sendEmail({
      from: fromField,
      to: ownerEmail,
      subject: `New Booking Alert - Reservation #${bookingData.tripId}`,
      html: htmlContent,
      text: `New Booking Received!\n\nReservation ID: ${bookingData.tripId}\nCustomer: ${bookingData.firstName} ${bookingData.lastName}\nEmail: ${bookingData.email}\nPhone: ${bookingData.phone}\nFrom: ${bookingData.pickup}${bookingData.stops && bookingData.stops.length > 0 ? '\nStops: ' + bookingData.stops.map((stop, index) => {
        const durationText = stop.duration && stop.duration > 0 ? ` (Wait: ${stop.duration >= 60 ? `${Math.floor(stop.duration / 60)}h${stop.duration % 60 > 0 ? ` ${stop.duration % 60}m` : ''}` : `${stop.duration}m`})` : '';
        return `Stop ${index + 1}: ${stop.location}${durationText}`;
      }).join(', ') : ''}\nTo: ${bookingData.dropoff}\nDeparture Date: ${bookingData.date} at ${bookingData.time}${bookingData.tripType === 'roundtrip' && bookingData.returnDate ? `\nReturn Date: ${bookingData.returnDate} at ${bookingData.returnTime}` : ''}${bookingData.flightNumber ? `\nFlight Number: ${bookingData.flightNumber}` : ''}\nVehicle: ${bookingData.vehicleDetails.name}\nTotal Amount: ${currencySymbol}${bookingData.totalAmount}\n\nPlease review and confirm this booking.`,
    });

    if (!success) {
      console.error("❌ Failed to send notification email to owner:", ownerEmail);
      return false;
    }

    console.log("✅ Notification email sent to owner:", ownerEmail);
    return true;
  } catch (error) {
    console.error("❌ Error sending notification email:", error);
    return false;
  }
}