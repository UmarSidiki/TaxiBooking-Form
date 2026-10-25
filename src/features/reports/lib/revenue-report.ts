import { Booking } from "@/features/booking/model";

export async function revenueByMonth() {
  return Booking.aggregate<{ _id: string; rides: number; total: number }>([
    { $match: { status: { $ne: "canceled" }, totalAmount: { $type: "number" } } },
    {
      $group: {
        _id: { $substrCP: ["$date", 0, 7] },
        rides: { $sum: 1 },
        total: { $sum: "$totalAmount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

export function revenueCsv(rows: { _id: string; rides: number; total: number }[]) {
  const lines = ["month,rides,total"];
  for (const row of rows) lines.push(`${row._id},${row.rides},${Number(row.total).toFixed(2)}`);
  return lines.join("\n");
}
