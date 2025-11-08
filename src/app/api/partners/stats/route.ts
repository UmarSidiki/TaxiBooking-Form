import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongoose";
import Booking from "@/models/Booking";
import { authOptions } from "@/lib/auth/options";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "partner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const partnerId = session.user.id;
    const now = new Date();

    // Get all bookings assigned to this partner
    const allBookings = await Booking.find({
      "assignedDriver._id": partnerId,
    });

    // Calculate stats
    const totalRides = allBookings.length;
    
    const upcomingRides = allBookings.filter(
      (booking) =>
        booking.status !== "canceled" &&
        new Date(booking.date) >= now
    ).length;

    const completedRides = allBookings.filter(
      (booking) =>
        booking.status !== "canceled" &&
        new Date(booking.date) < now
    ).length;

    const canceledRides = allBookings.filter(
      (booking) => booking.status === "canceled"
    ).length;

    // Calculate total earnings (only from completed rides)
    const totalEarnings = allBookings
      .filter(
        (booking) =>
          booking.status !== "canceled" &&
          new Date(booking.date) < now &&
          booking.paymentStatus === "paid"
      )
      .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

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
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while fetching stats",
      },
      { status: 500 }
    );
  }
}
