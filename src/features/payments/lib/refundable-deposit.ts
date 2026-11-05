type DepositBooking = {
  depositPaidCents?: number | null;
  amountRefundedCents?: number | null;
  stripePaymentIntentId?: string | null;
  multisafepayOrderId?: string | null;
};

/** Online deposit still available to refund (integer minor units). */
export function refundableDepositCents(booking: DepositBooking): number {
  const deposit = Math.max(0, Number(booking.depositPaidCents) || 0);
  if (deposit <= 0) return 0;
  const refunded = Math.max(0, Number(booking.amountRefundedCents) || 0);
  return Math.max(0, deposit - refunded);
}

export function hasOnlineDeposit(booking: DepositBooking): boolean {
  return (
    refundableDepositCents(booking) > 0 &&
    Boolean(booking.stripePaymentIntentId || booking.multisafepayOrderId)
  );
}
