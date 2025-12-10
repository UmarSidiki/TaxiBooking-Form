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
  paymentMethod?: string;
  paymentStatus?: string;
  flightNumber?: string;
}

function generateOwnerEmailHTML(bookingData: BookingData, currency: string = 'EUR') {
  const currencySymbol = getCurrencySymbol(currency);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>New Booking Alert - Reservation #${bookingData.tripId}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .section { margin-bottom: 20px; }
    .section h2 { color: #4a5568; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; }
    .details { background-color: #f7fafc; padding: 15px; border-radius: 5px; }
    .details ul { margin: 0; padding-left: 20px; }
    .details li { margin-bottom: 8px; }
    .payment { background-color: #edf2f7; padding: 15px; border-radius: 5px; }
    .footer { color: #718096; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
    .highlight { color: #2d3748; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; color: #2b6cb0;">New Booking Alert</h1>
      <p>You have received a new booking request!</p>
    </div>

    <div class="section">
      <h2>Customer Details</h2>
      <div class="details">
        <ul>
          <li><span class="highlight">Name:</span> ${bookingData.firstName} ${bookingData.lastName}</li>
          <li><span class="highlight">Email:</span> <a href="mailto:${bookingData.email}">${bookingData.email}</a></li>
          <li><span class="highlight">Phone:</span> <a href="tel:${bookingData.phone}">${bookingData.phone}</a></li>
        </ul>
      </div>
    </div>

    <div class="section">
      <h2>Journey Details</h2>
      <div class="details">
        <ul>
          <li><span class="highlight">Reservation ID:</span> #${bookingData.tripId}</li>
          <li><span class="highlight">Pickup:</span> ${bookingData.pickup}</li>
          ${bookingData.stops && bookingData.stops.length > 0 ? bookingData.stops.map((stop, index) =>
            `<li><span class="highlight">Stop ${index + 1}:</span> ${stop.location}</li>`
          ).join('') : ''}
          <li><span class="highlight">Dropoff:</span> ${bookingData.dropoff}</li>
          <li><span class="highlight">Departure Date:</span> ${bookingData.date}</li>
          <li><span class="highlight">Departure Time:</span> ${bookingData.time}</li>
          ${bookingData.tripType === 'roundtrip' && bookingData.returnDate ? 
            `<li><span class="highlight">Return Date:</span> ${bookingData.returnDate}</li>` : ''}
          ${bookingData.tripType === 'roundtrip' && bookingData.returnTime ? 
            `<li><span class="highlight">Return Time:</span> ${bookingData.returnTime}</li>` : ''}
          <li><span class="highlight">Reservation Type:</span> ${bookingData.tripType}</li>
          ${bookingData.flightNumber ? `<li><span class="highlight">Flight Number:</span> ${bookingData.flightNumber}</li>` : ''}
          <li><span class="highlight">Vehicle:</span> ${bookingData.vehicleDetails.name}</li>
          <li><span class="highlight">Passengers:</span> ${bookingData.passengers}</li>
          ${bookingData.childSeats > 0 ? `<li><span class="highlight">Child Seats:</span> ${bookingData.childSeats}</li>` : ''}
          ${bookingData.babySeats > 0 ? `<li><span class="highlight">Baby Seats:</span> ${bookingData.babySeats}</li>` : ''}
        </ul>
      </div>
    </div>

    ${bookingData.notes ? `
    <div class="section">
      <h2>Special Requests</h2>
      <div class="details">
        <p>${bookingData.notes}</p>
      </div>
    </div>
    ` : ''}

    <div class="section">
      <h2>Payment Summary</h2>
      <div class="payment">
        ${bookingData.taxAmount && bookingData.taxAmount > 0 ? `
        <p><span class="highlight">Subtotal:</span> ${currencySymbol}${(bookingData.subtotalAmount || bookingData.totalAmount).toFixed(2)}</p>
        <p><span class="highlight">Tax (${bookingData.taxPercentage || 0}%):</span> ${currencySymbol}${bookingData.taxAmount.toFixed(2)}</p>
        <p><span class="highlight">Total Amount (Incl. Tax): ${currencySymbol}${bookingData.totalAmount.toFixed(2)}</span></p>
        ` : `
        <p><span class="highlight">Total Amount: ${currencySymbol}${bookingData.totalAmount.toFixed(2)}</span></p>
        `}
        ${bookingData.paymentMethod ? `
        <p><span class="highlight">Payment Method:</span> ${bookingData.paymentMethod.replace('_', ' ')}</p>
        <p><span class="highlight">Payment Status:</span> ${bookingData.paymentStatus || 'Pending'}</p>
        ` : ''}
      </div>
    </div>

    <div class="section">
      <p>Please review this booking and confirm the Reservation details with the customer.</p>
    </div>

    <div class="footer">
      <p>This is an automated notification.</p>
      <p>© ${new Date().getFullYear()} Booking Service. All rights reserved.</p>
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

    const htmlContent = generateOwnerEmailHTML(bookingData, currency);

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