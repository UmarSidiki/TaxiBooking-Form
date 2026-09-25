import { connectDB } from "@/shared/db";
import { Booking } from "@/features/booking/model";
import { Setting } from "@/features/settings/model";
import { sendOrderThankYouEmail } from "@/features/booking/email/order-thank-you";
import { patchBooking } from "@/features/booking/lib/patch-booking.service";

export async function sendThankYouEmails() {
  try {
    await connectDB();

    const settings = await Setting.findOne();
    const timeZone =
      settings?.timezone ||
      process.env.NEXT_PUBLIC_APP_TIMEZONE ||
      "Europe/Zurich";

    const nowInTargetTzStr = new Date().toLocaleString("en-US", {
      timeZone,
      hour12: false,
    });
    const nowInTargetTz = new Date(nowInTargetTzStr);

    const threeHoursAgo = new Date(nowInTargetTz);
    threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);

    const potentialBookings = await Booking.find({
      status: { $in: ["upcoming", "completed"] },
      thankYouEmailSent: { $ne: true },
      email: { $exists: true, $ne: "" },
    }).limit(100);

    const completedBookings = potentialBookings.filter((booking) => {
      const bookingDateTime = new Date(`${booking.date}T${booking.time}:00`);
      return bookingDateTime < threeHoursAgo;
    });

    console.log(
      `Found ${completedBookings.length} completed bookings eligible for thank you emails`
    );

    let sentCount = 0;
    let failedCount = 0;
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    for (const booking of completedBookings) {
      try {
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
          locale: booking.locale,
          bookingType: booking.bookingType,
          duration: booking.duration,
          baseUrl,
        };

        const emailSent = await sendOrderThankYouEmail(emailData);

        if (emailSent) {
          try {
            await Booking.findByIdAndUpdate(booking._id, {
              thankYouEmailSent: true,
              updatedAt: new Date(),
            });

            if (booking.status !== "completed") {
              const result = await patchBooking(
                booking._id.toString(),
                { action: "complete" },
                baseUrl
              );
              if (!result.ok) {
                console.error(
                  "Failed to mark booking as completed via patchBooking",
                  result.status,
                  result.message
                );
                failedCount++;
                continue;
              }
            }

            sentCount++;
            console.log(
              `✅ Thank you email sent and booking completed (if needed): ${booking.tripId}`
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
