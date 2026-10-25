import DriverTimeOff from "@/features/drivers/model/DriverTimeOff";
import { rideInterval } from "@/features/calendar/lib/ride-window";

export async function driverTimeOffBlocks(
  driverId: string,
  booking: {
    date: string;
    time: string;
    bookingType?: string | null;
    duration?: number | null;
    tripType?: string | null;
  },
) {
  const window = rideInterval(booking);
  if (!window) return false;
  const hit = await DriverTimeOff.findOne({
    driverId,
    startsAt: { $lt: window.end },
    endsAt: { $gt: window.start },
  })
    .select("_id")
    .lean();
  return Boolean(hit);
}
