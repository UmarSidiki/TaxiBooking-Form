import { Booking } from "@/features/booking/model";
import PricingRule from "@/features/pricing/model/PricingRule";
import { zonedRideInstant } from "@/features/booking/lib/send-pickup-reminders";

export async function ridesForEmail(email: string) {
  const rows = await Booking.find({ email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") })
    .sort({ date: -1, time: -1 })
    .limit(50)
    .select("tripId pickup dropoff date time returnDate returnTime status paymentStatus totalAmount bookingType duration")
    .lean();
  const now = new Date().toISOString().slice(0, 10);
  return {
    upcoming: rows.filter((row) => row.status !== "canceled" && row.status !== "completed" && row.date >= now),
    past: rows.filter((row) => row.status === "completed" || row.status === "canceled" || row.date < now),
  };
}

export async function changeAllowed(booking: { date: string; time: string }) {
  const rule = await PricingRule.findOne().select("customerCutoffHours").lean();
  const hours = rule?.customerCutoffHours ?? 2;
  const instant = zonedRideInstant(booking.date, booking.time, "UTC");
  if (!instant) return false;
  return instant.getTime() - Date.now() >= hours * 60 * 60 * 1000;
}
