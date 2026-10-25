import { Booking } from "@/features/booking/model";
import { Vehicle } from "@/features/fleet/model";
import { priceServerBooking } from "@/features/pricing/lib/price-server-booking";
import { fetchRouteDistanceKm } from "@/features/payments/lib/fare/route-distance";
import { loadPaymentSettings } from "@/features/payments/lib/load-payment-settings";
import RecurringRide from "@/features/corporate/model/RecurringRide";
import { generateTripId } from "@/shared/lib/generate-id";

export async function generateDueRecurring(now = new Date()) {
  const date = now.toISOString().slice(0, 10);
  const weekday = now.getUTCDay();
  const rules = await RecurringRide.find({ active: true, weekdays: weekday }).limit(50).lean();
  const { settings } = await loadPaymentSettings();
  let created = 0;
  for (const rule of rules) {
    const exists = await Booking.findOne({ recurringId: rule._id, date });
    if (exists) continue;
    const vehicle = await Vehicle.findById(rule.vehicleId);
    if (!vehicle) continue;
    const hourly = rule.bookingType === "hourly";
    const distanceKm = hourly
      ? undefined
      : await fetchRouteDistanceKm({ pickup: rule.pickup, dropoff: rule.dropoff || "" });
    if (!hourly && distanceKm == null) continue;
    const priced = await priceServerBooking({
      vehicle,
      booking: {
        bookingType: hourly ? "hourly" : "destination",
        tripType: "oneway",
        duration: rule.duration,
        pickup: rule.pickup,
        dropoff: rule.dropoff,
        date,
        time: rule.time,
        childSeats: 0,
        babySeats: 0,
        email: rule.email,
      },
      distanceKm,
      tax: settings ?? {},
    });
    if (!priced.ok || priced.quote.total <= 0) continue;
    const quote = priced.quote;
    await Booking.create({
      tripId: generateTripId(),
      pickup: rule.pickup,
      dropoff: rule.dropoff,
      bookingType: hourly ? "hourly" : "destination",
      duration: rule.duration,
      tripType: "oneway",
      date,
      time: rule.time,
      passengers: 1,
      selectedVehicle: rule.vehicleId,
      firstName: rule.firstName,
      lastName: rule.lastName,
      email: rule.email,
      phone: rule.phone || "+10000000000",
      paymentMethod: "bank_transfer",
      paymentStatus: "pending",
      status: "upcoming",
      totalAmount: quote.total,
      subtotalAmount: quote.subtotal,
      taxAmount: quote.taxAmount,
      taxPercentage: quote.taxPercentage,
      fareLines: quote.lines,
      depositDue: quote.depositDue,
      balanceDue: quote.balanceDue,
      priceSource: "computed",
      recurringId: rule._id,
      corporateAccountId: rule.corporateAccountId,
      notes: "",
      childSeats: 0,
      babySeats: 0,
    });
    created += 1;
  }
  return { success: true, created };
}
