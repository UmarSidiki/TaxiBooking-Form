import { connectDB } from "@/shared/db";
import CronMarker from "@/features/cron/model/CronMarker";

export function dailyStamp(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

/** Claim today's daily pass. A second call the same UTC day returns null. */
export async function claimDailyRun(now = new Date()) {
  await connectDB();
  const stamp = dailyStamp(now);
  await CronMarker.updateOne(
    { key: "daily" },
    { $setOnInsert: { lastRunOn: "" } },
    { upsert: true },
  );
  const claimed = await CronMarker.findOneAndUpdate(
    { key: "daily", lastRunOn: { $ne: stamp } },
    { $set: { lastRunOn: stamp } },
  );
  return claimed ? stamp : null;
}

export async function unclaimDailyRun(stamp: string) {
  await connectDB();
  await CronMarker.updateOne(
    { key: "daily", lastRunOn: stamp },
    { $set: { lastRunOn: "" } },
  );
}
