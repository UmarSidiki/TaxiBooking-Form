import { connectDB } from "@/shared/db";
import CronMarker from "@/features/cron/model/CronMarker";

const LOCK_MS = 50_000;

async function ensureLockRow() {
  await CronMarker.updateOne(
    { key: "lock" },
    { $setOnInsert: { lockedUntil: new Date(0) } },
    { upsert: true },
  );
}

export async function withCronLock<T>(
  work: () => Promise<T>,
): Promise<{ locked: true; value: T } | { locked: false }> {
  await connectDB();
  await ensureLockRow();
  const now = new Date();
  const acquired = await CronMarker.findOneAndUpdate(
    { key: "lock", lockedUntil: { $lte: now } },
    { $set: { lockedUntil: new Date(now.getTime() + LOCK_MS) } },
  );
  if (!acquired) return { locked: false };
  try {
    return { locked: true, value: await work() };
  } finally {
    await CronMarker.updateOne({ key: "lock" }, { $set: { lockedUntil: new Date(0) } });
  }
}
