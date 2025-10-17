import { connectDB } from "@/lib/mongoose";
import Booking from "@/models/Booking";
import { sendOrderThankYouEmail } from "@/controllers/email/OrderThankYou";

export async function sendThankYouEmails() {
  try {
    await connectDB();

    // Calculate the cutoff time: 3 hours ago
    const threeHoursAgo = new Date();
    threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);

    // Find completed bookings that:
    // - Are not canceled
    // - Haven't had thank you email sent yet
    // - Have a valid email
    const potentialBookings = await Booking.find({
      status: { $ne: "canceled" },
      thankYouEmailSent: { $ne: true },
      email: { $exists: true, $ne: "" },
    });

    // Filter in JS to check if the booking date/time is more than 3 hours ago
    const completedBookings = potentialBookings.filter((booking) => {
      const bookingDateTime = new Date(`${booking.date}T${booking.time}:00`);
      return bookingDateTime < threeHoursAgo;
    });

    console.log(`Found ${completedBookings.length} completed bookings eligible for thank you emails`);

    let sentCount = 0;
    let failedCount = 0;

    for (const booking of completedBookings) {
      try {
        // Prepare email data
        const emailData = {
          tripId: booking.tripId,
          pickup: booking.pickup,
          dropoff: booking.dropoff || 'N/A (Hourly booking)',
          stops: booking.stops || [],
          tripType: booking.tripType,
          date: booking.date,
          time: booking.time,
          passengers: booking.passengers,
          selectedVehicle: booking.selectedVehicle,
          vehicleDetails: booking.vehicleDetails || {
            name: booking.selectedVehicle,
            price: 'N/A',
            seats: 'N/A'
          },
          childSeats: booking.childSeats,
          babySeats: booking.babySeats,
          notes: booking.notes,
          firstName: booking.firstName,
          lastName: booking.lastName,
          email: booking.email,
          phone: booking.phone,
          totalAmount: typeof booking.totalAmount === "number" ? booking.totalAmount : 0,
          paymentMethod: booking.paymentMethod,
          paymentStatus: booking.paymentStatus,
        };

        // Send the email
        const emailSent = await sendOrderThankYouEmail(emailData);

        if (emailSent) {
          // Mark as sent
          await Booking.findByIdAndUpdate(booking._id, {
            thankYouEmailSent: true,
            updatedAt: new Date()
          });
          sentCount++;
          console.log(`✅ Thank you email sent for booking ${booking.tripId}`);
        } else {
          failedCount++;
          console.error(`❌ Failed to send thank you email for booking ${booking.tripId}`);
        }
      } catch (error) {
        console.error(`❌ Error processing thank you email for booking ${booking.tripId}:`, error);
        failedCount++;
      }
    }

    return {
      success: true,
      message: `Thank you emails processed. Sent: ${sentCount}, Failed: ${failedCount}`,
      sent: sentCount,
      failed: failedCount,
      total: completedBookings.length
    };
  } catch (error) {
    console.error("Error sending thank you emails:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to send thank you emails",
    };
  }
}