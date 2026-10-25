import { Booking } from "@/features/booking/model";
import { DASHBOARD_PREVIEW_LIMIT } from "@/features/dashboard/lib/dashboard-preview-limit";
import { dashboardStatWindow } from "@/features/dashboard/lib/dashboard-stat-window";

type Totals = {
  totalBookings: number;
  completedBookings: number;
  upcomingBookings: number;
  canceledBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  lastMonthRevenue: number;
  monthlyBookings: number;
  lastMonthBookings: number;
};

export async function aggregateDashboardStats(now = new Date(), timeZone = "UTC") {
  const { nowInTz, lastMonth, currentMonth } = dashboardStatWindow(now, timeZone);
  const [totals, recent, destinations] = await Promise.all([
    Booking.aggregate<Totals>([
      {
        $addFields: {
          rideDate: {
            $dateFromString: {
              dateString: "$date",
              format: "%Y-%m-%d",
              timezone: "UTC",
              onError: null,
              onNull: null,
            },
          },
          rideAt: {
            $dateFromString: {
              dateString: {
                $concat: ["$date", "T", { $ifNull: ["$time", "00:00"] }, ":00"],
              },
              timezone: "UTC",
              onError: null,
              onNull: null,
            },
          },
          amount: {
            $convert: { input: { $ifNull: ["$totalAmount", 0] }, to: "double", onError: 0, onNull: 0 },
          },
        },
      },
      {
        $addFields: {
          monthStart: { $dateTrunc: { date: "$rideDate", unit: "month", timezone: timeZone } },
          monthKey: {
            $dateToString: { format: "%Y-%m", date: "$rideDate", timezone: timeZone, onNull: "" },
          },
          confirmed: { $in: ["$status", ["upcoming", "completed"]] },
          paid: {
            $or: [{ $eq: ["$paymentStatus", "completed"] }, { $eq: ["$paymentMethod", "cash"] }],
          },
          passed: { $lt: ["$rideAt", nowInTz] },
        },
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: { $cond: ["$confirmed", 1, 0] } },
          canceledBookings: { $sum: { $cond: [{ $eq: ["$status", "canceled"] }, 1, 0] } },
          completedBookings: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$status", "completed"] },
                    { $and: ["$paid", "$passed", "$confirmed"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          upcomingBookings: {
            $sum: {
              $cond: [{ $and: [{ $not: "$passed" }, { $eq: ["$status", "upcoming"] }] }, 1, 0],
            },
          },
          totalRevenue: { $sum: { $cond: [{ $and: ["$paid", "$confirmed"] }, "$amount", 0] } },
          monthlyRevenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    "$confirmed",
                    "$paid",
                    { $gte: ["$rideDate", currentMonth] },
                    { $lte: ["$rideDate", now] },
                  ],
                },
                "$amount",
                0,
              ],
            },
          },
          lastMonthRevenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    "$confirmed",
                    "$paid",
                    { $gte: ["$rideDate", lastMonth] },
                    { $lt: ["$rideDate", currentMonth] },
                  ],
                },
                "$amount",
                0,
              ],
            },
          },
          monthlyBookings: {
            $sum: {
              $cond: [
                { $and: ["$confirmed", { $gte: ["$rideDate", currentMonth] }, { $lte: ["$rideDate", now] }] },
                1,
                0,
              ],
            },
          },
          lastMonthBookings: {
            $sum: {
              $cond: [
                { $and: ["$confirmed", { $gte: ["$rideDate", lastMonth] }, { $lt: ["$rideDate", currentMonth] }] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
    Booking.find({})
      .sort({ createdAt: -1 })
      .limit(DASHBOARD_PREVIEW_LIMIT)
      .select("firstName lastName date status totalAmount")
      .lean(),
    Booking.aggregate<{ total: number; rows: { _id: string; count: number }[] }>([
      { $group: { _id: { $ifNull: ["$dropoff", "Unknown"] }, count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      {
        $group: {
          _id: null,
          total: { $sum: "$count" },
          rows: { $push: { _id: "$_id", count: "$count" } },
        },
      },
      { $project: { total: 1, rows: { $slice: ["$rows", DASHBOARD_PREVIEW_LIMIT] } } },
    ]),
  ]);

  const row = totals[0] ?? {
    totalBookings: 0,
    completedBookings: 0,
    upcomingBookings: 0,
    canceledBookings: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    lastMonthRevenue: 0,
    monthlyBookings: 0,
    lastMonthBookings: 0,
  };
  const destinationTotal = destinations[0]?.total ?? 0;
  const destinationRows = destinations[0]?.rows ?? [];
  return {
    totalBookings: row.totalBookings,
    completedBookings: row.completedBookings,
    upcomingBookings: row.upcomingBookings,
    canceledBookings: row.canceledBookings,
    totalRevenue: row.totalRevenue,
    monthlyRevenue: row.monthlyRevenue,
    monthlyChange:
      row.lastMonthRevenue > 0
        ? Math.round(((row.monthlyRevenue - row.lastMonthRevenue) / row.lastMonthRevenue) * 100)
        : 0,
    monthlyBookings: row.monthlyBookings,
    monthlyBookingsChange:
      row.lastMonthBookings > 0
        ? Math.round(((row.monthlyBookings - row.lastMonthBookings) / row.lastMonthBookings) * 100)
        : 0,
    recentBookings: recent.map((booking) => ({
      id: String(booking._id),
      customer: `${booking.firstName} ${booking.lastName}`,
      date: new Date(booking.date).toLocaleDateString(),
      status: booking.status || "upcoming",
      amount: typeof booking.totalAmount === "number" ? booking.totalAmount : 0,
    })),
    topDestinations: destinationRows.map((item) => ({
      name: item._id,
      count: item.count,
      percentage: destinationTotal > 0 ? Math.round((item.count / destinationTotal) * 100) : 0,
    })),
  };
}
