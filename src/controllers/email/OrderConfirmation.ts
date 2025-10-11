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
}

export async function sendOrderConfirmationEmail(bookingData: BookingData) {
  // Implement email sending logic here
  // This could use nodemailer, sendgrid, resend, etc.

  console.log("=== Sending Confirmation Email to User ===");
  console.log(`To: ${bookingData.email}`);
  console.log(`Trip ID: ${bookingData.tripId}`);
  console.log(`Customer: ${bookingData.firstName} ${bookingData.lastName}`);
  console.log(`From: ${bookingData.pickup} → To: ${bookingData.dropoff}`);
  console.log(`Date/Time: ${bookingData.date} at ${bookingData.time}`);
  console.log(`Vehicle: ${bookingData.vehicleDetails.name} (${bookingData.vehicleDetails.seats})`);
  console.log(`Passengers: ${bookingData.passengers}`);
  console.log(`Child Seats: ${bookingData.childSeats} | Baby Seats: ${bookingData.babySeats}`);
  console.log(`Total Amount: €${bookingData.totalAmount}`);
  console.log(`Notes: ${bookingData.notes || 'None'}`);
  console.log("==========================================\n");

  // Example implementation with nodemailer:
  // const transporter = nodemailer.createTransporter({
  //   host: process.env.SMTP_HOST,
  //   port: parseInt(process.env.SMTP_PORT || '587'),
  //   secure: false,
  //   auth: {
  //     user: process.env.SMTP_USER,
  //     pass: process.env.SMTP_PASS,
  //   },
  // });
  //
  // await transporter.sendMail({
  //   from: process.env.SMTP_FROM || 'noreply@yourcompany.com',
  //   to: bookingData.email,
  //   subject: `Booking Confirmation - Trip ${bookingData.tripId}`,
  //   html: `
  //     <h1>Booking Confirmed!</h1>
  //     <p>Dear ${bookingData.firstName} ${bookingData.lastName},</p>
  //     <p>Your booking has been confirmed. Here are the details:</p>
  //     <ul>
  //       <li><strong>Trip ID:</strong> ${bookingData.tripId}</li>
  //       <li><strong>From:</strong> ${bookingData.pickup}</li>
  //       <li><strong>To:</strong> ${bookingData.dropoff}</li>
  //       <li><strong>Date:</strong> ${bookingData.date} at ${bookingData.time}</li>
  //       <li><strong>Vehicle:</strong> ${bookingData.vehicleDetails.name}</li>
  //       <li><strong>Passengers:</strong> ${bookingData.passengers}</li>
  //       <li><strong>Total Amount:</strong> €${bookingData.totalAmount}</li>
  //     </ul>
  //   `,
  // });

  return true;
}