import type { IPriceTier } from "@/features/fleet/model/Vehicle";

/**
 * Given a sorted array of price tiers and a distance, returns the one-way
 * vehicle price (before minimum-fare enforcement and round-trip multiplier).
 *
 * Tier lookup rules:
 * - Tiers are matched in ascending upToKm order.
 * - The first tier whose upToKm >= distanceKm is used.
 * - type "flat"   → the tier's price IS the total trip price.
 * - type "per_km" → price × distanceKm.
 * - If distanceKm exceeds all tier boundaries the last tier is used.
 *
 * Returns undefined when tiers is empty / undefined (caller falls back to
 * the legacy base+pricePerKm formula).
 */
export function applyPriceTiers(
  tiers: IPriceTier[] | undefined,
  distanceKm: number
): number | undefined {
  if (!tiers || tiers.length === 0) return undefined;

  // Sort defensively in case tiers arrive unsorted from DB
  const sorted = [...tiers].sort((a, b) => a.upToKm - b.upToKm);

  // Find the first tier that covers this distance
  const tier = sorted.find((t) => distanceKm <= t.upToKm) ?? sorted[sorted.length - 1];

  if (tier.type === "flat") {
    return tier.price;
  }

  // per_km
  return tier.price * distanceKm;
}
