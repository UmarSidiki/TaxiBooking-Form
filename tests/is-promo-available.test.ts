import { describe, expect, it } from "vitest";
import {
  clearPromoAvailabilityCache,
  isPromoAvailable,
} from "@/features/pricing/lib/is-promo-available";
import { loadPromo } from "@/features/pricing/lib/redeem-promo";
import PromoCode from "@/features/pricing/model/PromoCode";
import { Setting } from "@/features/settings/model";

describe("isPromoAvailable", () => {
  it("is false when no promo codes exist", async () => {
    expect(await isPromoAvailable()).toBe(false);
  });

  it("is true when an active, usable code exists", async () => {
    await PromoCode.create({ code: "SAVE10", kind: "percent", amount: 10 });
    expect(await isPromoAvailable()).toBe(true);
  });

  it("is false when promo codes are disabled in settings", async () => {
    await PromoCode.create({ code: "SAVE10", kind: "percent", amount: 10 });
    await Setting.create({ promoCodesEnabled: false });
    expect(await isPromoAvailable()).toBe(false);
  });

  it("ignores inactive, expired and exhausted codes", async () => {
    await PromoCode.create({ code: "OFF", kind: "fixed", amount: 5, active: false });
    await PromoCode.create({ code: "OLD", kind: "fixed", amount: 5, expiresAt: new Date(Date.now() - 1000) });
    await PromoCode.create({ code: "USED", kind: "fixed", amount: 5, maxUses: 1, usedCount: 1 });
    expect(await isPromoAvailable()).toBe(false);
  });

  it("caches the answer until the cache is cleared", async () => {
    expect(await isPromoAvailable()).toBe(false);
    await PromoCode.create({ code: "LATE", kind: "percent", amount: 5 });
    expect(await isPromoAvailable()).toBe(false);
    clearPromoAvailabilityCache();
    expect(await isPromoAvailable()).toBe(true);
  });
});

describe("promo availability on quote", () => {
  it("rejects an inactive promo code", async () => {
    await PromoCode.create({ code: "OFF", kind: "fixed", amount: 5, active: false });
    const result = await loadPromo("OFF", "ada@example.com");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("promo_invalid");
  });
});
