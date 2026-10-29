import { connectDB } from "@/shared/db";
import PromoCode from "@/features/pricing/model/PromoCode";
import Setting from "@/features/settings/model/Setting";

const TTL_MS = 60_000;
let cache: { value: boolean; at: number } | null = null;

/** Drop the memoized answer so an admin change is visible on the next request. */
export function clearPromoAvailabilityCache() {
  cache = null;
}

/** Promos a customer may use right now: active-ish, unexpired, under the cap. */
export function activePromoFilter(now = new Date()) {
  return {
    active: { $ne: false },
    $and: [
      { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
      {
        $or: [
          { maxUses: null },
          { $expr: { $lt: [{ $ifNull: ["$usedCount", 0] }, "$maxUses"] } },
        ],
      },
    ],
  };
}

/**
 * Whether the booking form should offer a promo code field: promos are enabled
 * in settings and at least one usable (active, unexpired, under its limit) code
 * exists. Cached in memory for 60 seconds.
 */
export async function isPromoAvailable(): Promise<boolean> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.value;

  await connectDB();
  const setting = await Setting.findOne().lean<{ promoCodesEnabled?: boolean }>();
  const enabled = setting?.promoCodesEnabled !== false;

  const available = enabled
    ? (await PromoCode.exists(activePromoFilter(new Date(now)))) != null
    : false;

  cache = { value: available, at: now };
  return available;
}
