import { connectDB } from "@/shared/db";
import PromoCode from "@/features/pricing/model/PromoCode";
import PromoRedemption from "@/features/pricing/model/PromoRedemption";

export type PromoFailure = "promo_invalid" | "promo_expired" | "promo_limit";

export async function loadPromo(code: string | undefined, customerKey: string, now = new Date()) {
  const normalized = code?.trim().toUpperCase();
  if (!normalized) return { ok: true as const, promo: null };
  await connectDB();
  const promo = await PromoCode.findOne({ code: normalized });
  if (!promo) return { ok: false as const, error: "promo_invalid" as const };
  if (promo.active === false) return { ok: false as const, error: "promo_invalid" as const };
  if (promo.expiresAt && promo.expiresAt.getTime() <= now.getTime()) {
    return { ok: false as const, error: "promo_expired" as const };
  }
  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) {
    return { ok: false as const, error: "promo_limit" as const };
  }
  if (promo.maxUsesPerCustomer != null && customerKey) {
    const row = await PromoRedemption.findOne({ promoId: promo._id, customerKey });
    if (row && row.count >= promo.maxUsesPerCustomer) {
      return { ok: false as const, error: "promo_limit" as const };
    }
  }
  return {
    ok: true as const,
    promo: { code: promo.code, kind: promo.kind, amount: promo.amount, id: String(promo._id) },
  };
}

/** Atomic increment. Call only when the booking is actually stored. */
export async function redeemPromo(promoId: string, customerKey: string) {
  await connectDB();
  const promo = await PromoCode.findById(promoId);
  if (!promo) return { ok: false as const, error: "promo_invalid" as const };
  const filter =
    promo.maxUses == null ? { _id: promo._id } : { _id: promo._id, usedCount: { $lt: promo.maxUses } };
  const updated = await PromoCode.findOneAndUpdate(filter, { $inc: { usedCount: 1 } });
  if (!updated) return { ok: false as const, error: "promo_limit" as const };
  if (customerKey) {
    await PromoRedemption.updateOne(
      { promoId: promo._id, customerKey },
      { $inc: { count: 1 } },
      { upsert: true },
    );
  }
  return { ok: true as const };
}
