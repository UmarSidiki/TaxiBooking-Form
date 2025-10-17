import { sendEmail } from '@/lib/email';
import { getMongoDb } from '@/lib/mongodb';

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
}

function generateOwnerEmailHTML(bookingData: BookingData) {
  const getCurrencySymbol = () => '€';

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
          <li><span class="highlight">Date:</span> ${bookingData.date}</li>
          <li><span class="highlight">Time:</span> ${bookingData.time}</li>
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
        <p><span class="highlight">Total Amount: ${getCurrencySymbol()}${bookingData.totalAmount.toFixed(2)}</span></p>
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
    // First, try to get admin email from database (users collection)
    const db = await getMongoDb();
    const usersCollection = db.collection("users");
    const adminUser = await usersCollection.findOne({ role: "admin" });

    const ownerEmail = adminUser?.email || process.env.OWNER_EMAIL;

    if (!ownerEmail) {
      console.log("⚠️ No admin email found in database or OWNER_EMAIL not configured. Owner notification skipped.");
      return true;
    }

    const htmlContent = generateOwnerEmailHTML(bookingData);

    const success = await sendEmail({
      from: process.env.SMTP_FROM || `"Booking System" <${process.env.SMTP_USER}>`,
      to: ownerEmail,
      subject: `New Booking Alert - Reservation #${bookingData.tripId}`,
      html: htmlContent,
      text: `New Booking Received!\n\nReservation ID: ${bookingData.tripId}\nCustomer: ${bookingData.firstName} ${bookingData.lastName}\nEmail: ${bookingData.email}\nPhone: ${bookingData.phone}\nFrom: ${bookingData.pickup}${bookingData.stops && bookingData.stops.length > 0 ? '\nStops: ' + bookingData.stops.map((stop, index) => `Stop ${index + 1}: ${stop.location}`).join(', ') : ''}\nTo: ${bookingData.dropoff}\nDate: ${bookingData.date} at ${bookingData.time}${bookingData.flightNumber ? `\nFlight Number: ${bookingData.flightNumber}` : ''}\nVehicle: ${bookingData.vehicleDetails.name}\nTotal Amount: €${bookingData.totalAmount}\n\nPlease review and confirm this booking.`,
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