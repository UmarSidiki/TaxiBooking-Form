import mongoose, { Schema } from "mongoose";
import { connectDB } from "@/shared/db";

const RateWindowSchema = new Schema(
  { key: { type: String, required: true }, window: { type: String, required: true }, count: { type: Number, default: 0 } },
  { timestamps: false },
);
RateWindowSchema.index({ key: 1, window: 1 }, { unique: true });
RateWindowSchema.index({ window: 1 }, { expireAfterSeconds: 7200 });

const RateWindow = mongoose.models.RateWindow || mongoose.model("RateWindow", RateWindowSchema);

export async function mongoWindowLimit(key: string, limit: number) {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/incr/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
      });
      const data = (await response.json()) as { result?: number };
      if (typeof data.result === "number" && data.result > limit) {
        return { ok: false as const, retryAfter: 60 };
      }
      if (response.ok) return { ok: true as const, retryAfter: 0 };
    } catch {
      // Fall through to Mongo so a Redis outage does not open the route.
    }
  }
  await connectDB();
  const window = new Date().toISOString().slice(0, 16);
  const hit = await RateWindow.findOneAndUpdate(
    { key, window },
    { $inc: { count: 1 } },
    { upsert: true, new: true },
  );
  if ((hit?.count ?? 1) > limit) return { ok: false as const, retryAfter: 60 };
  return { ok: true as const, retryAfter: 0 };
}

export default RateWindow;
