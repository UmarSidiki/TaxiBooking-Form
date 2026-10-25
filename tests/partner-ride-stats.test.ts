import { describe, expect, it } from "vitest";
import { Booking, type IBooking } from "@/features/booking/model";
import { computePartnerRideStats } from "@/features/partners/lib/compute-partner-ride-stats";
import { createPartner, createRide, createVehicle } from "./helpers/fixtures";

const NOW = new Date("2026-06-15T12:00:00.000Z");

function legacyStats(bookings: IBooking[], now: Date) {
  const parseBookingDate = (booking: IBooking) => {
    if (!booking.date) return null;
    const parsedWithTime = new Date(`${booking.date}T${booking.time || "00:00"}`);
    if (!Number.isNaN(parsedWithTime.getTime())) return parsedWithTime;
    const fallback = new Date(booking.date);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  };
  const isPaymentComplete = (booking: IBooking) =>
    booking.paymentStatus === "completed" || booking.paymentMethod === "cash";
  const isCompletedRide = (booking: IBooking) => {
    if (booking.status === "completed") return true;
    if (booking.status === "canceled") return false;
    const bookingDate = parseBookingDate(booking);
    return Boolean(bookingDate && bookingDate < now && isPaymentComplete(booking));
  };
  const isUpcomingRide = (booking: IBooking) => {
    if (booking.status === "canceled") return false;
    const bookingDate = parseBookingDate(booking);
    if (!bookingDate) return booking.status === "upcoming";
    return bookingDate > now;
  };
  const resolvePartnerAmount = (booking: IBooking) => {
    const rawValue =
      typeof booking.partnerPayoutAmount === "number"
        ? booking.partnerPayoutAmount
        : booking.totalAmount;
    const amount = typeof rawValue === "number" ? rawValue : Number.parseFloat(String(rawValue || 0));
    return Number.isFinite(amount) ? amount : 0;
  };
  const completed = bookings.filter(isCompletedRide);
  return {
    totalRides: bookings.length,
    upcomingRides: bookings.filter(isUpcomingRide).length,
    completedRides: completed.length,
    canceledRides: bookings.filter((booking) => booking.status === "canceled").length,
    totalEarnings: completed.reduce((sum, booking) => sum + resolvePartnerAmount(booking), 0),
  };
}

describe("partner ride stats", () => {
  it("matches the previous in-memory rules without loading full bookings", async () => {
    const vehicle = await createVehicle();
    const partner = await createPartner({
      name: "Alpha",
      email: "alpha@example.com",
      vehicleId: vehicle._id,
    });
    const assigned = {
      _id: partner._id,
      name: partner.name,
      email: partner.email,
    };
    await createRide({
      selectedVehicle: vehicle._id,
      assignedPartner: assigned,
      date: "2026-07-01",
      status: "upcoming",
      partnerPayoutAmount: 40,
    });
    await createRide({
      selectedVehicle: vehicle._id,
      assignedPartner: assigned,
      date: "2026-05-01",
      status: "upcoming",
      paymentStatus: "completed",
      partnerPayoutAmount: 25,
    });
    await createRide({
      selectedVehicle: vehicle._id,
      assignedPartner: assigned,
      date: "2026-05-02",
      status: "upcoming",
      paymentStatus: "pending",
      paymentMethod: "stripe",
      partnerPayoutAmount: 99,
    });
    await createRide({
      selectedVehicle: vehicle._id,
      assignedPartner: assigned,
      date: "2026-08-01",
      status: "canceled",
      partnerPayoutAmount: 10,
    });
    await createRide({
      selectedVehicle: vehicle._id,
      assignedPartner: assigned,
      date: "2026-12-01",
      status: "completed",
      totalAmount: 70,
    });
    await createRide({
      selectedVehicle: vehicle._id,
      assignedPartner: assigned,
      date: "not-a-date",
      time: "10:00",
      status: "upcoming",
      partnerPayoutAmount: 5,
    });

    const stored = await Booking.find({ "assignedPartner._id": partner._id });
    const expected = legacyStats(stored, NOW);
    const actual = await computePartnerRideStats(String(partner._id), NOW);

    expect(actual).toEqual(expected);
    expect(actual).toMatchObject({
      totalRides: 6,
      upcomingRides: 3,
      completedRides: 2,
      canceledRides: 1,
      totalEarnings: 95,
    });
  });
});
