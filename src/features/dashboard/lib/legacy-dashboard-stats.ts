import { DASHBOARD_PREVIEW_LIMIT } from "@/features/dashboard/lib/dashboard-preview-limit";
import { dashboardStatWindow } from "@/features/dashboard/lib/dashboard-stat-window";

export type LegacyStatsBooking = {
  _id?: { toString(): string };
  date: string;
  time?: string;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  totalAmount?: number | string | null;
  firstName?: string;
  lastName?: string;
  dropoff?: string;
  createdAt?: Date;
};

function amountOf(value: number | string | null | undefined) {
  const amount = typeof value === "number" ? value : Number.parseFloat(String(value || 0));
  return Number.isNaN(amount) ? 0 : amount;
}

function confirmed(booking: LegacyStatsBooking) {
  return booking.status === "upcoming" || booking.status === "completed";
}

function paid(booking: LegacyStatsBooking) {
  return booking.paymentStatus === "completed" || booking.paymentMethod === "cash";
}

/** Previous dashboard totals, kept so the aggregation can be checked against them. */
export function legacyDashboardStats(
  bookings: LegacyStatsBooking[],
  now = new Date(),
  timeZone = "UTC",
) {
  const { nowInTz, lastMonth, currentMonth } = dashboardStatWindow(now, timeZone);
  const sorted = [...bookings].sort(
    (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
  );
  const inMonth = (booking: LegacyStatsBooking, start: Date, end: Date, endInclusive: boolean) => {
    const bookingDate = new Date(booking.date);
    const afterStart = bookingDate >= start;
    const beforeEnd = endInclusive ? bookingDate <= end : bookingDate < end;
    return afterStart && beforeEnd && confirmed(booking);
  };
  const currentMonthBookings = sorted.filter((booking) => inMonth(booking, currentMonth, now, true));
  const lastMonthBookings = sorted.filter((booking) => inMonth(booking, lastMonth, currentMonth, false));
  const passed = (booking: LegacyStatsBooking) =>
    new Date(`${booking.date}T${booking.time || "00:00"}:00`) < nowInTz;

  const completedBookings = sorted.filter(
    (booking) =>
      booking.status === "completed" || (paid(booking) && passed(booking) && confirmed(booking)),
  ).length;
  const upcomingBookings = sorted.filter(
    (booking) => !passed(booking) && booking.status === "upcoming",
  ).length;
  const sum = (rows: LegacyStatsBooking[]) =>
    rows.filter((booking) => paid(booking) && confirmed(booking)).reduce((total, booking) => total + amountOf(booking.totalAmount), 0);

  const monthlyRevenue = sum(currentMonthBookings);
  const lastMonthRevenue = sum(lastMonthBookings);
  const destinationCounts: Record<string, number> = {};
  for (const booking of sorted) {
    const dest = booking.dropoff || "Unknown";
    destinationCounts[dest] = (destinationCounts[dest] || 0) + 1;
  }
  const totalDestinations = Object.values(destinationCounts).reduce((a, b) => a + b, 0);

  return {
    totalBookings: sorted.filter(confirmed).length,
    completedBookings,
    upcomingBookings,
    canceledBookings: sorted.filter((booking) => booking.status === "canceled").length,
    totalRevenue: sum(sorted),
    monthlyRevenue,
    monthlyChange: lastMonthRevenue > 0 ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0,
    monthlyBookings: currentMonthBookings.length,
    monthlyBookingsChange:
      lastMonthBookings.length > 0
        ? Math.round(((currentMonthBookings.length - lastMonthBookings.length) / lastMonthBookings.length) * 100)
        : 0,
    recentBookings: sorted.slice(0, DASHBOARD_PREVIEW_LIMIT).map((booking) => ({
      id: booking._id?.toString() ?? "",
      customer: `${booking.firstName ?? ""} ${booking.lastName ?? ""}`.trim(),
      date: new Date(booking.date).toLocaleDateString(),
      status: booking.status || "upcoming",
      amount: amountOf(booking.totalAmount),
    })),
    topDestinations: Object.entries(destinationCounts)
      .sort(([nameA, countA], [nameB, countB]) => countB - countA || nameA.localeCompare(nameB))
      .slice(0, DASHBOARD_PREVIEW_LIMIT)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalDestinations > 0 ? Math.round((count / totalDestinations) * 100) : 0,
      })),
  };
}
