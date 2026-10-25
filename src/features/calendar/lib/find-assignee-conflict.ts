import { Booking } from "@/features/booking/model";
import { intervalsOverlap, rideInterval } from "@/features/calendar/lib/ride-window";

export async function findAssigneeConflict(input: {
  field: "assignedDriver._id" | "assignedPartner._id";
  assigneeId: string;
  booking: { _id?: unknown; date: string; time: string; bookingType?: string; duration?: number; tripType?: string };
}) {
  const next = rideInterval(input.booking);
  if (!next) return null;
  const rides = await Booking.find({
    [input.field]: input.assigneeId,
    status: { $in: ["upcoming", "completed"] },
    date: input.booking.date,
  })
    .select("date time bookingType duration tripType tripId")
    .limit(50)
    .lean();

  for (const ride of rides) {
    if (input.booking._id && String(ride._id) === String(input.booking._id)) continue;
    const existing = rideInterval(ride);
    if (existing && intervalsOverlap(next, existing)) {
      return `Overlaps ${ride.tripId} at ${ride.time}`;
    }
  }
  return null;
}
