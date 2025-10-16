import nodemailer from 'nodemailer';

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

function generateEmailHTML(bookingData: BookingData) {
  const getCurrencySymbol = () => '€';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Booking Confirmation - Trip #${bookingData.tripId}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1>Booking Confirmed</h1>
    <p>Dear ${bookingData.firstName} ${bookingData.lastName},</p>
    <p>Thank you for choosing our service! Your trip has been confirmed.</p>

    <h2>Journey Details</h2>
    <ul>
      <li><strong>Trip ID:</strong> #${bookingData.tripId}</li>
      <li><strong>From:</strong> ${bookingData.pickup}</li>
      <li><strong>To:</strong> ${bookingData.dropoff}</li>
      <li><strong>Date:</strong> ${bookingData.date}</li>
      <li><strong>Time:</strong> ${bookingData.time}</li>
      <li><strong>Trip Type:</strong> ${bookingData.tripType}</li>
    </ul>

    <h2>Vehicle & Passengers</h2>
    <ul>
      <li><strong>Vehicle:</strong> ${bookingData.vehicleDetails.name}</li>
      <li><strong>Max Seats:</strong> ${bookingData.vehicleDetails.seats}</li>
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

    <p>If you have any questions, please contact us.</p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <p style="color: #666; font-size: 12px;">
      This is an automated email. Please do not reply.<br>
      © ${new Date().getFullYear()} Booking Service. All rights reserved.
    </p>
  </div>
</body>
</html>
  `;
}

export async function sendOrderConfirmationEmail(bookingData: BookingData) {
  try {
    
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      console.log("⚠️ SMTP not configured. Email sending skipped.");
      console.log("✉️ Would send confirmation email to:", bookingData.email);
      return true;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const htmlContent = generateEmailHTML(bookingData);

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Booking Service" <${process.env.SMTP_USER}>`,
      to: bookingData.email,
      subject: `Booking Confirmation - Trip #${bookingData.tripId}`,
      html: htmlContent,
      text: `Booking Confirmed!\n\nTrip ID: ${bookingData.tripId}\nCustomer: ${bookingData.firstName} ${bookingData.lastName}\nFrom: ${bookingData.pickup}\nTo: ${bookingData.dropoff}\nDate: ${bookingData.date} at ${bookingData.time}\nVehicle: ${bookingData.vehicleDetails.name}\nTotal Amount: €${bookingData.totalAmount}`,
    });

    console.log("✅ Confirmation email sent to:", bookingData.email);
    return true;
  } catch (error) {
    console.error("❌ Error sending confirmation email:", error);
    return false;
  }
}