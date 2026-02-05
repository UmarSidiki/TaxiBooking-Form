import { connectDB } from "@/lib/database";
import { Booking } from "@/models/booking";
import { Setting } from "@/models/settings";
import { sendOrderThankYouEmail } from "@/controllers/email/bookings";

export async function sendThankYouEmails() {
  try {
    await connectDB();

    // Fetch settings to get configured timezone
    const settings = await Setting.findOne();
    
    // Calculate the cutoff time in target timezone
    // Use stored timezone or fallback to ENV or Zurich
    const timeZone = settings?.timezone || process.env.NEXT_PUBLIC_APP_TIMEZONE || 'Europe/Zurich';
    
    // Get current time in the target timezone
    // We format it to a string, then parse it back to a "floating" Date object
    // This floating object represents the time in Zurich, but acts as if it's local/UTC 
    // for consistent comparison with the booking date strings.
    const nowInTargetTzStr = new Date().toLocaleString('en-US', { timeZone, hour12: false });
    const nowInTargetTz = new Date(nowInTargetTzStr);
    
    const threeHoursAgo = new Date(nowInTargetTz);
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

    // Filter to check if the booking date/time is more than 3 hours ago
    const completedBookings = potentialBookings.filter((booking) => {
      // Create date object from booking strings (Floating time)
      // "2023-10-27" + "T" + "18:00" -> 2023-10-27T18:00:00 (Floating)
      const bookingDateTime = new Date(`${booking.date}T${booking.time}:00`);
      
      // Compare Floating Booking Time vs Floating Current Time (both in Zurich context)
      return bookingDateTime < threeHoursAgo;
    });

    console.log(
      `Found ${completedBookings.length} completed bookings eligible for thank you emails`
    );

    let sentCount = 0;
    let failedCount = 0;

    for (const booking of completedBookings) {
      try {
        // Prepare email data
        const emailData = {
          tripId: booking.tripId,
          pickup: booking.pickup,
          dropoff: booking.dropoff || "N/A (Hourly booking)",
          stops: booking.stops || [],
          tripType: booking.tripType,
          date: booking.date,
          time: booking.time,
          returnDate: booking.returnDate,
          returnTime: booking.returnTime,
          passengers: booking.passengers,
          selectedVehicle: booking.selectedVehicle,
          vehicleDetails: booking.vehicleDetails || {
            name: booking.selectedVehicle,
            price: "N/A",
            seats: "N/A",
          },
          childSeats: booking.childSeats,
          babySeats: booking.babySeats,
          notes: booking.notes,
          firstName: booking.firstName,
          lastName: booking.lastName,
          email: booking.email,
          phone: booking.phone,
          totalAmount:
            typeof booking.totalAmount === "number" ? booking.totalAmount : 0,
          paymentMethod: booking.paymentMethod,
          paymentStatus: booking.paymentStatus,
          bookingId: booking._id.toString(),
          baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        };

        // Send the email
        const emailSent = await sendOrderThankYouEmail(emailData);

        if (emailSent) {
          try {
            // Mark that thank-you email was sent
            await Booking.findByIdAndUpdate(booking._id, {
              thankYouEmailSent: true,
              updatedAt: new Date(),
            });

            // If the booking is not yet completed, call the same
            // PATCH /api/bookings/[id] complete logic used by the dashboard
            if (booking.status !== "completed") {
              const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

              const response = await fetch(
                `${baseUrl}/api/bookings/${booking._id.toString()}`,
                {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ action: "complete" }),
                }
              );

              if (!response.ok) {
                const data = await response.json().catch(() => null);
                console.error(
                  "Failed to mark booking as completed via API",
                  response.status,
                  data
                );
                failedCount++;
                continue;
              }
            }

            sentCount++;
            console.log(
              `✅ Thank you email sent and booking completed (if needed) via API: ${booking.tripId}`
            );
          } catch (completionError) {
            console.error(
              `❌ Error completing booking after thank you email for ${booking.tripId}:`,
              completionError
            );
            failedCount++;
          }
        } else {
          failedCount++;
          console.error(
            `❌ Failed to send thank you email for booking ${booking.tripId}`
          );
        }
      } catch (error) {
        console.error(
          `❌ Error processing thank you email for booking ${booking.tripId}:`,
          error
        );
        failedCount++;
      }
    }

    return {
      success: true,
      message: `Thank you emails processed. Sent: ${sentCount}, Failed: ${failedCount}`,
      sent: sentCount,
      failed: failedCount,
      total: completedBookings.length,
    };
  } catch (error) {
    console.error("Error sending thank you emails:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to send thank you emails",
    };
  }
}
