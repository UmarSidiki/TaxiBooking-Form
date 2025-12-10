import { connectDB } from "@/lib/database";
import { Booking } from "@/models/booking";

/**
 * Delete completed rides that are older than 90 days
 * Runs as part of the cron job
 */
export async function deleteOldCompletedRides() {
  try {
    await connectDB();

    // Calculate the date 90 days ago
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Find and delete completed rides older than 90 days
    const result = await Booking.deleteMany({
      status: "completed",
      date: { $lt: ninetyDaysAgo.toISOString().split('T')[0] } // Compare date strings
    });

    console.log(`🗑️ Deleted ${result.deletedCount} completed rides older than 90 days`);

    return {
      success: true,
      deletedCount: result.deletedCount,
      message: `Successfully deleted ${result.deletedCount} old completed rides`
    };
  } catch (error) {
    console.error("Error deleting old completed rides:", error);
    return {
      success: false,
      deletedCount: 0,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}
