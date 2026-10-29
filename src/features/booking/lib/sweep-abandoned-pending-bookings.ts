import { PendingBooking } from "@/features/booking/model";
import { connectDB } from "@/shared/db";

const ABANDON_AFTER_MS = 24 * 60 * 60 * 1000;

/**
 * Marks checkout drafts that were never paid as abandoned. The TTL index is a
 * later safety net, so the status survives long enough for support to inspect.
 */
export async function sweepAbandonedPendingBookings() {
  await connectDB();
  const cutoff = new Date(Date.now() - ABANDON_AFTER_MS);
  const result = await PendingBooking.updateMany(
    { status: "open", createdAt: { $lt: cutoff } },
    { $set: { status: "abandoned" } }
  );
  return { success: true, count: result.modifiedCount };
}
