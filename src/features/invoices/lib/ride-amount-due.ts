function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function rideAmountDue(booking: {
  paymentStatus?: string | null;
  totalAmount?: number | null;
  depositDue?: number | null;
  balanceDue?: number | null;
}) {
  const total = roundMoney(booking.totalAmount ?? 0);
  const depositDue = roundMoney(booking.depositDue ?? 0);
  const balanceDue = roundMoney(booking.balanceDue ?? 0);
  const settled = booking.paymentStatus === "completed" || booking.paymentStatus === "refunded";
  if (settled) {
    return {
      total,
      depositDue,
      balanceDue,
      amountDue: balanceDue > 0 ? balanceDue : 0,
      purpose: balanceDue > 0 ? ("balance" as const) : ("full" as const),
    };
  }
  if (depositDue > 0 && depositDue < total) {
    return {
      total,
      depositDue,
      balanceDue: roundMoney(total - depositDue),
      amountDue: depositDue,
      purpose: "deposit" as const,
    };
  }
  return { total, depositDue: 0, balanceDue: 0, amountDue: total, purpose: "full" as const };
}
