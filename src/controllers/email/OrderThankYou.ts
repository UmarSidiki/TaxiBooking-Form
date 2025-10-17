import { sendEmail } from "@/lib/email";

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

// Email validation utility
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generateEmailHTML(bookingData: BookingData) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Thank You - Reservation #${bookingData.tripId}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f0f9ff; padding: 20px; border-radius: 5px; margin-bottom: 20px; text-align: center; }
    .header h1 { margin: 0; color: #0369a1; }
    .section { margin-bottom: 20px; }
    .section h2 { color: #4a5568; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; }
    .details { background-color: #f7fafc; padding: 15px; border-radius: 5px; }
    .details ul { margin: 0; padding-left: 20px; }
    .details li { margin-bottom: 8px; }
    .footer { color: #718096; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
    .highlight { color: #2d3748; font-weight: bold; }
    .cta-button {
      display: inline-block;
      background-color: #0369a1;
      color: #ffffff !important;
      padding: 10px 20px;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 15px;
      font-weight: bold;
      text-align: center;
    }
    .cta-button span {
      color: #ffffff !important;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Thank You for Choosing Us!</h1>
      <p>Dear ${bookingData.firstName} ${bookingData.lastName},</p>
      <p>We hope you had a great experience with our service!</p>
    </div>

    <div class="section">
      <h2>Your Recent Trip</h2>
      <div class="details">
        <ul>
          <li><span class="highlight">Reservation ID:</span> #${
            bookingData.tripId
          }</li>
          <li><span class="highlight">From:</span> ${bookingData.pickup}</li>
          <li><span class="highlight">To:</span> ${bookingData.dropoff}</li>
          <li><span class="highlight">Date:</span> ${bookingData.date}</li>
          <li><span class="highlight">Time:</span> ${bookingData.time}</li>
          <li><span class="highlight">Vehicle:</span> ${
            bookingData.vehicleDetails.name
          }</li>
        </ul>
      </div>
    </div>

    <div class="section">
      <p>We value your feedback! Please take a moment to rate your experience.</p>
      <a href="mailto:feedback@example.com?subject=Feedback for Reservation #${
        bookingData.tripId
      }" class="cta-button">
        <span>Share Your Feedback</span>
      </a>
    </div>

    <div class="section">
      <p>Book with us again for your next trip!</p>
      <a href="${
        process.env.NEXT_PUBLIC_APP_URL || "https://example.com"
      }" class="cta-button">
        <span>Book Another Trip</span>
      </a>
    </div>

    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
      <p>© ${new Date().getFullYear()} Booking Service. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendOrderThankYouEmail(bookingData: BookingData) {
  try {
    // Validate email before sending
    if (!bookingData.email || !isValidEmail(bookingData.email)) {
      console.error("❌ Invalid customer email address:", bookingData.email);
      return false;
    }

    console.log("📧 Preparing thank you email for:", bookingData.email);

    const htmlContent = generateEmailHTML(bookingData);

    const success = await sendEmail({
      from:
        process.env.SMTP_FROM || `"Booking Service" <${process.env.SMTP_USER}>`,
      to: bookingData.email,
      subject: `Thank You for Your Trip - Reservation #${bookingData.tripId}`,
      html: htmlContent,
      text: `Thank You!\n\nDear ${bookingData.firstName} ${bookingData.lastName},\n\nThank you for choosing our service for Reservation #${bookingData.tripId}.\n\nYour trip details:\nFrom: ${bookingData.pickup}\nTo: ${bookingData.dropoff}\nDate: ${bookingData.date} at ${bookingData.time}\nVehicle: ${bookingData.vehicleDetails.name}\n\nWe hope to serve you again soon!`,
    });

    if (!success) {
      console.error("❌ Failed to send thank you email to:", bookingData.email);
      return false;
    }

    console.log("✅ Thank you email sent to:", bookingData.email);
    return true;
  } catch (error) {
    console.error("❌ Error sending thank you email:", error);
    return false;
  }
}
