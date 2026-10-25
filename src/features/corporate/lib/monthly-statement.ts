import { Booking } from "@/features/booking/model";
import CorporateAccount from "@/features/corporate/model/CorporateAccount";

export async function corporateMonth(accountId: string, month: string) {
  const account = await CorporateAccount.findById(accountId).lean();
  if (!account) return null;
  const rows = await Booking.find({
    corporateAccountId: accountId,
    date: { $gte: `${month}-01`, $lte: `${month}-31` },
    status: { $ne: "canceled" },
  })
    .select("tripId date time pickup dropoff totalAmount paymentStatus")
    .limit(500)
    .lean();
  const total = rows.reduce((sum, row) => sum + (row.totalAmount || 0), 0);
  return { account, rows, total: Math.round(total * 100) / 100, month };
}
