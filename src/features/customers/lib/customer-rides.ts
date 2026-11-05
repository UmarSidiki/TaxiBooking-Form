import { Booking } from "@/features/booking/model";
import PricingRule from "@/features/pricing/model/PricingRule";
import { Setting } from "@/features/settings/model";
import { zonedRideInstant } from "@/features/booking/lib/send-pickup-reminders";
import { rideAmountDue } from "@/features/invoices/lib/ride-amount-due";
import { ridePayUrl } from "@/features/invoices/lib/ride-pay-link";
import { resolvePublicUrl } from "@/features/settings/lib/public-url";

type RideRow = {
  tripId: string;
  date: string;
  status?: string | null;
  locale?: string;
  depositDue?: number | null;
  balanceDue?: number | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  totalAmount?: number | null;
  [key: string]: unknown;
};

function withAmountDue(row: RideRow, baseUrl: string | null) {
  const voided = row.status === "canceled" || row.paymentStatus === "refunded";
  // Requests are not payable through the ride balance link until confirmed.
  const requestPending =
    row.status === "requested" || row.status === "awaiting_payment";
  const due = rideAmountDue(row);
  return {
    ...row,
    depositDue: voided ? 0 : due.depositDue,
    balanceDue: voided || requestPending ? 0 : due.balanceDue,
    amountDue: voided || requestPending ? 0 : due.amountDue,
    payUrl:
      !voided &&
      !requestPending &&
      due.purpose === "balance" &&
      row.paymentMethod !== "cash"
        ? ridePayUrl(baseUrl, row.locale, row.tripId)
        : null,
  };
}

export async function ridesForEmail(email: string) {
  const rows = (await Booking.find({ email: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") })
    .sort({ date: -1, time: -1 })
    .limit(50)
    .select("tripId pickup dropoff date time returnDate returnTime status paymentStatus paymentMethod totalAmount depositDue balanceDue bookingType duration passengers childSeats babySeats meetAndGreet vehicleDetails selectedVehicle assignedDriver assignedPartner driverRideStatus whatsappOptIn firstName lastName phone locale")
    .lean()) as unknown as RideRow[];
  const baseUrl = rows.some((row) => rideAmountDue(row).purpose === "balance")
    ? await resolvePublicUrl()
    : null;
  const decorated = rows.map((row) => withAmountDue(row, baseUrl));
  const now = new Date().toISOString().slice(0, 10);
  return {
    upcoming: decorated.filter((row) => row.status !== "canceled" && row.status !== "completed" && (row.date as string) >= now),
    past: decorated.filter((row) => row.status === "completed" || (row.status !== "canceled" && (row.date as string) < now)),
    canceled: decorated.filter((row) => row.status === "canceled"),
  };
}

export async function changeAllowed(booking: { date: string; time: string }) {
  const [rule, settings] = await Promise.all([
    PricingRule.findOne().select("customerCutoffHours").lean(),
    Setting.findOne().select("timezone").lean<{ timezone?: string }>(),
  ]);
  const hours = rule?.customerCutoffHours ?? 2;
  const tz = settings?.timezone || "Europe/Zurich";
  const instant = zonedRideInstant(booking.date, booking.time, tz);
  if (!instant) return false;
  return instant.getTime() - Date.now() >= hours * 60 * 60 * 1000;
}