import { connectDB } from "@/shared/db";
import { Setting } from "@/features/settings/model";
import PricingRule from "@/features/pricing/model/PricingRule";
import { holidayCutoff } from "@/features/pricing/lib/holidays";

/** Drops holiday ranges 12h after their end date (operator time). One indexed update. */
export async function pruneExpiredHolidays(now = new Date()) {
  await connectDB();
  const setting = await Setting.findOne({}, { timezone: 1 }).lean<{ timezone?: string }>();
  const cutoff = holidayCutoff(now, setting?.timezone);
  const result = await PricingRule.updateMany({ "holidays.end": { $lt: cutoff } }, { $pull: { holidays: { end: { $lt: cutoff } } } });
  return result.modifiedCount;
}
