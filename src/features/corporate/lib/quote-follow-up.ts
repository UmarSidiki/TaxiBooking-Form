import { Booking } from "@/features/booking/model";
import { sendEmail } from "@/features/settings/lib/email";

export async function sendQuoteFollowUps(now = new Date()) {
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const rows = await Booking.find({
    status: "awaiting_payment",
    quoteFollowUpSent: { $ne: true },
    createdAt: { $lte: cutoff },
  })
    .select("tripId email pickup date time")
    .limit(30);
  let sent = 0;
  for (const ride of rows) {
    const claimed = await Booking.findOneAndUpdate(
      { _id: ride._id, quoteFollowUpSent: { $ne: true } },
      { $set: { quoteFollowUpSent: true } },
    );
    if (!claimed) continue;
    await sendEmail({
      to: ride.email,
      subject: `Still need the ride ${ride.tripId}?`,
      text: `Your quote for ${ride.pickup} on ${ride.date} at ${ride.time} is still open.`,
    });
    sent += 1;
  }
  return { success: true, sent };
}
