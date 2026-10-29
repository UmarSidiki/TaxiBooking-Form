export type CancelPolicyTier = { hoursBefore: number; feePercent: number };

export function normalizeCancelPolicy(
  policy?: CancelPolicyTier[] | null
): CancelPolicyTier[] {
  if (!Array.isArray(policy) || policy.length === 0) {
    return [{ hoursBefore: 24, feePercent: 0 }];
  }
  return policy
    .map((tier) => ({
      hoursBefore: Number(tier?.hoursBefore ?? 0),
      feePercent: Number(tier?.feePercent ?? 0),
    }))
    .filter((tier) => Number.isFinite(tier.hoursBefore) && Number.isFinite(tier.feePercent));
}

export function cancelFeePercent(
  policy: CancelPolicyTier[] | null | undefined,
  hoursUntil: number
): number {
  const tiers = normalizeCancelPolicy(policy);
  // feePercent applies to cancellations made *within* hoursBefore of the ride.
  // Pick the tier with the smallest hoursBefore that is still strictly greater
  // than hoursUntil; if none, no fee.
  const candidates = tiers
    .filter((tier) => hoursUntil < tier.hoursBefore)
    .sort((a, b) => a.hoursBefore - b.hoursBefore);
  if (candidates.length > 0) return candidates[0].feePercent;
  // Fall back to the tier with the largest hoursBefore that the ride has passed?
  // If hoursUntil is negative (past), use the highest feePercent.
  if (hoursUntil < 0) {
    return tiers.reduce((max, tier) => Math.max(max, tier.feePercent), 0);
  }
  return 0;
}

export function computeCancelFee(
  policy: CancelPolicyTier[] | null | undefined,
  totalAmount: number,
  hoursUntil: number
): { feePercent: number; feeAmount: number; refundAmount: number } {
  const feePercent = cancelFeePercent(policy, hoursUntil);
  const feeAmount = round2(totalAmount * (feePercent / 100));
  const refundAmount = round2(totalAmount - feeAmount);
  return { feePercent, feeAmount, refundAmount };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

// Aliases for compatibility with unknown callers.
export const getCancelFee = computeCancelFee;
export const cancelFee = computeCancelFee;
export const feeForCancel = computeCancelFee;
export const computeCancellationFee = computeCancelFee;
export const cancellationFee = computeCancelFee;