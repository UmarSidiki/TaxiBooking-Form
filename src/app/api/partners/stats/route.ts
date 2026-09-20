import { NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Booking, type IBooking } from "@/features/booking/model";
import { requireRole } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

export async function GET() {
  try {
    const access = await requireRole("partner");
    if (!access.ok) return access.response;

    await connectDB();

    const partnerId = access.session.user.id;
    const now = new Date();

    // Get all bookings assigned to this partner
    const allBookings = await Booking.find({
      "assignedPartner._id": partnerId,
    }).sort({ createdAt: -1 });

    const parseBookingDate = (booking: IBooking) => {
      if (!booking.date) {
        return null;
      }
      const withTime = `${booking.date}T${booking.time || "00:00"}`;
      const parsedWithTime = new Date(withTime);
      if (!Number.isNaN(parsedWithTime.getTime())) {
        return parsedWithTime;
      }
      const fallback = new Date(booking.date);
      return Number.isNaN(fallback.getTime()) ? null : fallback;
    };

    const isPaymentComplete = (booking: IBooking) =>
      booking.paymentStatus === "completed" || booking.paymentMethod === "cash";

    const isCompletedRide = (booking: IBooking) => {
      if (booking.status === "completed") {
        return true;
      }
      if (booking.status === "canceled") {
        return false;
      }
      const bookingDate = parseBookingDate(booking);
      return Boolean(bookingDate && bookingDate < now && isPaymentComplete(booking));
    };

    const isUpcomingRide = (booking: IBooking) => {
      if (booking.status === "canceled") {
        return false;
      }
      const bookingDate = parseBookingDate(booking);
      if (!bookingDate) {
        return booking.status === "upcoming";
      }
      return bookingDate > now;
    };

    const resolvePartnerAmount = (booking: IBooking) => {
      const rawValue =
        typeof booking.partnerPayoutAmount === "number"
          ? booking.partnerPayoutAmount
          : booking.totalAmount;
      const amount = typeof rawValue === "number" ? rawValue : parseFloat(String(rawValue || 0));
      return Number.isFinite(amount) ? amount : 0;
    };

    // Calculate stats
    const totalRides = allBookings.length;
    const upcomingRides = allBookings.filter(isUpcomingRide).length;
    const completedRides = allBookings.filter(isCompletedRide).length;
    const canceledRides = allBookings.filter(
      (booking) => booking.status === "canceled"
    ).length;

    // Calculate total earnings from rides we consider completed
    const totalEarnings = allBookings
      .filter(isCompletedRide)
      .reduce((sum, booking) => sum + resolvePartnerAmount(booking), 0);

    const stats = {
      totalRides,
      upcomingRides,
      completedRides,
      canceledRides,
      totalEarnings,
    };

    return NextResponse.json(
      {
        success: true,
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching partner stats:", error);
    return jsonError("internal_error", 500);
  }
}
