import { NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import { Booking } from "@/models/booking";

export async function GET() {
  try {
    await connectDB();

    // Get current date and last month date
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch all bookings
    const allBookings = await Booking.find({}).sort({ createdAt: -1 });

    // Filter bookings for current month (exclude cancelled)
    const currentMonthBookings = allBookings.filter((booking) => {
      const bookingDate = new Date(booking.date);
      return bookingDate >= currentMonth && bookingDate <= now && booking.status !== "canceled";
    });

    // Filter bookings for last month (exclude cancelled)
    const lastMonthBookings = allBookings.filter((booking) => {
      const bookingDate = new Date(booking.date);
      return bookingDate >= lastMonth && bookingDate < currentMonth && booking.status !== "canceled";
    });

    // Calculate stats
    const totalBookings = allBookings.length;
    const completedBookings = allBookings.filter((b) => {
      return b.status === "completed" || ((b.paymentStatus === "completed" || b.paymentMethod === "cash") && new Date(b.date) < now && b.status !== "canceled");
    }).length;
    const upcomingBookings = allBookings.filter((b) => {
      const bookingDate = new Date(b.date);
      return bookingDate > now && b.status !== "canceled";
    }).length;
    const canceledBookings = allBookings.filter(
      (b) => b.status === "canceled"
    ).length;

    // Calculate revenue (completed payments and cash bookings, exclude cancelled bookings)
    const totalRevenue = allBookings
      .filter((b) => (b.paymentStatus === "completed" || b.paymentMethod === "cash") && b.status !== "canceled")
      .reduce((sum, booking) => {
        const amount = typeof booking.totalAmount === 'number' ? booking.totalAmount : parseFloat(String(booking.totalAmount || 0));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

    const monthlyRevenue = currentMonthBookings
      .filter((b) => (b.paymentStatus === "completed" || b.paymentMethod === "cash") && b.status !== "canceled")
      .reduce((sum, booking) => {
        const amount = typeof booking.totalAmount === 'number' ? booking.totalAmount : parseFloat(String(booking.totalAmount || 0));
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

    const lastMonthRevenue = lastMonthBookings
      .filter((b) => (b.paymentStatus === "completed" || b.paymentMethod === "cash") && b.status !== "canceled")
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

    // Fetch recent bookings (last 5)
    const recentBookings = allBookings.slice(0, 5).map((booking) => ({
      id: booking._id.toString(),
      customer: `${booking.firstName} ${booking.lastName}`,
      date: new Date(booking.date).toLocaleDateString(),
      status: booking.status || 'upcoming',
      amount: booking.totalAmount || 0,
    }));

    // Calculate top destinations (aggregate by dropoff)
    const destinationCounts: { [key: string]: number } = {};
    allBookings.forEach((booking) => {
      const dest = booking.dropoff || "Unknown";
      destinationCounts[dest] = (destinationCounts[dest] || 0) + 1;
    });
    const totalDestinations = Object.values(destinationCounts).reduce((a, b) => a + b, 0);
    const topDestinations = Object.entries(destinationCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalDestinations > 0 ? Math.round((count / totalDestinations) * 100) : 0,
      }));

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
        recentBookings,
        topDestinations,
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
