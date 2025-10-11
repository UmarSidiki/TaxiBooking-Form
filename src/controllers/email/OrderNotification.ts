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

export async function sendOrderNotificationEmail(bookingData: BookingData) {
  // Send notification to business owner

  const ownerEmail = process.env.OWNER_EMAIL || 'owner@company.com';

  console.log("=== Sending Notification Email to Owner ===");
  console.log(`To: ${ownerEmail}`);
  console.log(`New Booking - Trip ID: ${bookingData.tripId}`);
  console.log(`Customer: ${bookingData.firstName} ${bookingData.lastName}`);
  console.log(`Contact: ${bookingData.email} | ${bookingData.phone}`);
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
  //   to: ownerEmail,
  //   subject: `New Booking Received - ${bookingData.tripId}`,
  //   html: `
  //     <h1>New Booking Received</h1>
  //     <p>A new booking has been made:</p>
  //     <h3>Customer Information:</h3>
  //     <ul>
  //       <li><strong>Name:</strong> ${bookingData.firstName} ${bookingData.lastName}</li>
  //       <li><strong>Email:</strong> ${bookingData.email}</li>
  //       <li><strong>Phone:</strong> ${bookingData.phone}</li>
  //     </ul>
  //     <h3>Trip Details:</h3>
  //     <ul>
  //       <li><strong>Trip ID:</strong> ${bookingData.tripId}</li>
  //       <li><strong>From:</strong> ${bookingData.pickup}</li>
  //       <li><strong>To:</strong> ${bookingData.dropoff}</li>
  //       <li><strong>Date:</strong> ${bookingData.date} at ${bookingData.time}</li>
  //       <li><strong>Vehicle:</strong> ${bookingData.vehicleDetails.name}</li>
  //       <li><strong>Passengers:</strong> ${bookingData.passengers}</li>
  //       <li><strong>Child Seats:</strong> ${bookingData.childSeats}</li>
  //       <li><strong>Baby Seats:</strong> ${bookingData.babySeats}</li>
  //       <li><strong>Total Amount:</strong> €${bookingData.totalAmount}</li>
  //       <li><strong>Notes:</strong> ${bookingData.notes || 'None'}</li>
  //     </ul>
  //   `,
  // });

  return true;
}