import { connectDB } from "@/lib/mongoose";
import Booking from "@/models/Booking";

/**
 * Cleanup abandoned MultiSafepay bookings
 * Cancels bookings that have been pending for more than 30 minutes
 */
export async function cleanupAbandonedBookings() {
  try {
    await connectDB();

    // Find bookings that are:
    // 1. Payment method is multisafepay
    // 2. Payment status is pending
    // 3. Created more than 30 minutes ago
    // 4. Not already cancelled
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const abandonedBookings = await Booking.find({
      paymentMethod: 'multisafepay',
      paymentStatus: 'pending',
      status: { $ne: 'canceled' },
      createdAt: { $lt: thirtyMinutesAgo }
    });

    if (abandonedBookings.length === 0) {
      console.log('No abandoned MultiSafepay bookings found');
      return {
        success: true,
        message: 'No abandoned bookings to clean up',
        count: 0
      };
    }

    // Cancel each abandoned booking
    const cancelPromises = abandonedBookings.map(async (booking) => {
      booking.status = 'canceled';
      booking.paymentStatus = 'failed';
      booking.canceledAt = new Date();
      await booking.save();
      return booking.tripId;
    });

    const cancelledIds = await Promise.all(cancelPromises);

    console.log(`Cancelled ${cancelledIds.length} abandoned MultiSafepay bookings:`, cancelledIds);

    return {
      success: true,
      message: `Cancelled ${cancelledIds.length} abandoned bookings`,
      count: cancelledIds.length,
      bookingIds: cancelledIds
    };
  } catch (error) {
    console.error('Error cleaning up abandoned bookings:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      count: 0
    };
  }
}
