import { Booking } from "@/features/booking/model";
import { generateTripId } from "@/shared/lib/generate-id";
import RecurringRide from "@/features/corporate/model/RecurringRide";

export async function generateDueRecurring(now = new Date()) {
  const date = now.toISOString().slice(0, 10);
  const weekday = now.getUTCDay();
  const rules = await RecurringRide.find({ active: true, weekdays: weekday }).limit(50).lean();
  let created = 0;
  for (const rule of rules) {
    const exists = await Booking.findOne({ recurringId: rule._id, date });
    if (exists) continue;
    await Booking.create({
      tripId: generateTripId(),
      pickup: rule.pickup,
      dropoff: rule.dropoff,
      bookingType: rule.bookingType,
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
      totalAmount: 0,
      priceSource: "manual",
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
