import { normalizeCancelPolicy, type CancelPolicyTier } from "./cancel-policy";

/** Smallest window with no fee; the ride is free to cancel before that many hours. */
export function freeCancellationHours(
  policy?: CancelPolicyTier[] | null,
): number | null {
  const freeTiers = normalizeCancelPolicy(policy).filter(
    (tier) => tier.feePercent === 0,
  );
  if (freeTiers.length === 0) return null;
  return Math.min(...freeTiers.map((tier) => tier.hoursBefore));
}

/** Ride wall-clock time minus the free-cancellation window. */
export function freeCancellationWallTime(
  date: string,
  time: string,
  policy?: CancelPolicyTier[] | null,
): { date: string; time: string } | null {
  const hours = freeCancellationHours(policy);
  if (hours === null) return null;
  const instant = new Date(`${date}T${time || "00:00"}:00Z`);
  if (Number.isNaN(instant.getTime())) return null;
  instant.setUTCHours(instant.getUTCHours() - hours);
  return {
    date: instant.toISOString().slice(0, 10),
    time: instant.toISOString().slice(11, 16),
  };
}
