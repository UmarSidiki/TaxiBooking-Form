import PartnerSettlementEntry from "@/features/partners/model/PartnerSettlementEntry";
import { roundMoney } from "@/features/partners/lib/partner-share-delta";

export async function listPartnerStatement(partnerId: string, month?: string) {
  const query: Record<string, unknown> = { partnerId };
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [year, monthIndex] = month.split("-").map(Number);
    const start = new Date(Date.UTC(year, monthIndex - 1, 1));
    const end = new Date(Date.UTC(year, monthIndex, 1));
    query.createdAt = { $gte: start, $lt: end };
  }

  const entries = await PartnerSettlementEntry.find(query)
    .sort({ createdAt: 1 })
    .limit(400)
    .lean();

  let running = 0;
  return entries.map((entry) => {
    const balanceDelta = typeof entry.balanceDelta === "number" ? entry.balanceDelta : 0;
    running = roundMoney(running + balanceDelta);
    return {
      _id: String(entry._id),
      type: entry.type,
      createdAt: entry.createdAt,
      bookingId: entry.bookingId ? String(entry.bookingId) : undefined,
      fare: entry.fare,
      margin: entry.margin,
      partnerShare: entry.partnerShare,
      amount: entry.amount,
      balanceDelta,
      runningBalance: running,
      method: entry.method,
      reference: entry.reference,
      note: entry.note,
      createdBy: entry.createdBy,
      currency: entry.currency,
    };
  });
}
