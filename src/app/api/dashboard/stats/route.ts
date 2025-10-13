import { NextResponse } from "next/server";
import { Booking } from "@/models/Booking";
import { getMongoDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getMongoDb();
    const collection = db.collection<Booking>("bookings");

    // Get current date and last month date
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch all bookings
    const allBookings = await collection.find({}).sort({ createdAt: -1 }).toArray();

    // Filter bookings for current month
    const currentMonthBookings = allBookings.filter((booking) => {
      const bookingDate = new Date(booking.date);
      return bookingDate >= currentMonth && bookingDate <= now;
    });

    // Filter bookings for last month
    const lastMonthBookings = allBookings.filter((booking) => {
      const bookingDate = new Date(booking.date);
      return bookingDate >= lastMonth && bookingDate < currentMonth;
    });

    // Calculate stats
    const totalBookings = allBookings.length;
    const completedBookings = allBookings.filter(
      (b) => b.status === "completed"
    ).length;
    const upcomingBookings = allBookings.filter((b) => {
      const bookingDate = new Date(b.date);
      return bookingDate > now && b.status !== "canceled";
    }).length;
    const canceledBookings = allBookings.filter(
      (b) => b.status === "canceled"
    ).length;

    // Calculate revenue (using paymentStatus instead of status for completed payments)
    const totalRevenue = allBookings
      .filter((b) => b.paymentStatus === "completed")
      .reduce((sum, booking) => {
        const amount = typeof booking.totalAmount === 'number' ? booking.totalAmount : parseFloat(String(booking.totalAmount || 0));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

    const monthlyRevenue = currentMonthBookings
      .filter((b) => b.paymentStatus === "completed")
      .reduce((sum, booking) => {
        const amount = typeof booking.totalAmount === 'number' ? booking.totalAmount : parseFloat(String(booking.totalAmount || 0));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

    const lastMonthRevenue = lastMonthBookings
      .filter((b) => b.paymentStatus === "completed")
      .reduce((sum, booking) => {
        const amount = typeof booking.totalAmount === 'number' ? booking.totalAmount : parseFloat(String(booking.totalAmount || 0));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

    // Calculate percentage changes
    const monthlyChange =
      lastMonthRevenue > 0
        ? Math.round(
            ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
          )
        : 0;

    const monthlyBookingsChange =
      lastMonthBookings.length > 0
        ? Math.round(
            ((currentMonthBookings.length - lastMonthBookings.length) /
              lastMonthBookings.length) *
              100
          )
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalBookings,
        completedBookings,
        upcomingBookings,
        canceledBookings,
        totalRevenue,
        monthlyRevenue,
        monthlyChange,
        monthlyBookings: currentMonthBookings.length,
        monthlyBookingsChange,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
