import { sendEmail } from '@/lib/email';
import { getMongoDb } from '@/lib/mongodb';

interface BookingData {
  tripId: string;
  pickup: string;
  dropoff: string;
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
}

function generateOwnerEmailHTML(bookingData: BookingData) {
  const getCurrencySymbol = () => '€';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>New Booking Alert - Trip #${bookingData.tripId}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1>New Booking Alert</h1>
    <p>You have received a new booking request!</p>

    <h2>Customer Details</h2>
    <ul>
      <li><strong>Name:</strong> ${bookingData.firstName} ${bookingData.lastName}</li>
      <li><strong>Email:</strong> <a href="mailto:${bookingData.email}">${bookingData.email}</a></li>
      <li><strong>Phone:</strong> <a href="tel:${bookingData.phone}">${bookingData.phone}</a></li>
    </ul>

    <h2>Journey Details</h2>
    <ul>
      <li><strong>Trip ID:</strong> #${bookingData.tripId}</li>
      <li><strong>Pickup:</strong> ${bookingData.pickup}</li>
      <li><strong>Dropoff:</strong> ${bookingData.dropoff}</li>
      <li><strong>Date:</strong> ${bookingData.date}</li>
      <li><strong>Time:</strong> ${bookingData.time}</li>
      <li><strong>Trip Type:</strong> ${bookingData.tripType}</li>
      <li><strong>Vehicle:</strong> ${bookingData.vehicleDetails.name}</li>
      <li><strong>Passengers:</strong> ${bookingData.passengers}</li>
      ${bookingData.childSeats > 0 ? `<li><strong>Child Seats:</strong> ${bookingData.childSeats}</li>` : ''}
      ${bookingData.babySeats > 0 ? `<li><strong>Baby Seats:</strong> ${bookingData.babySeats}</li>` : ''}
    </ul>

    ${bookingData.notes ? `
    <h2>Special Requests</h2>
    <p>${bookingData.notes}</p>
    ` : ''}

    <h2>Payment Summary</h2>
    <p><strong>Total Amount: ${getCurrencySymbol()}${bookingData.totalAmount.toFixed(2)}</strong></p>
    ${bookingData.paymentMethod ? `
    <p><strong>Payment Method:</strong> ${bookingData.paymentMethod.replace('_', ' ')}</p>
    <p><strong>Payment Status:</strong> ${bookingData.paymentStatus || 'Pending'}</p>
    ` : ''}

    <p>Please review this booking and confirm the trip details with the customer.</p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <p style="color: #666; font-size: 12px;">
      This is an automated notification.<br>
      © ${new Date().getFullYear()} Booking Service. All rights reserved.
    </p>
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
      subject: `New Booking Alert - Trip #${bookingData.tripId}`,
      html: htmlContent,
      text: `New Booking Received!\n\nTrip ID: ${bookingData.tripId}\nCustomer: ${bookingData.firstName} ${bookingData.lastName}\nEmail: ${bookingData.email}\nPhone: ${bookingData.phone}\nFrom: ${bookingData.pickup}\nTo: ${bookingData.dropoff}\nDate: ${bookingData.date} at ${bookingData.time}\nVehicle: ${bookingData.vehicleDetails.name}\nTotal Amount: €${bookingData.totalAmount}\n\nPlease review and confirm this booking.`,
    });

    if (!success) return false;

    console.log("✅ Notification email sent to owner:", ownerEmail);
    return true;
  } catch (error) {
    console.error("❌ Error sending notification email:", error);
    return false;
  }
}