function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

/** Online charge is the deposit when the percent is between 0 and 100. */
export function splitDeposit(total: number, depositPercent: number) {
  const fare = roundMoney(Math.max(0, total));
  const percent = Number(depositPercent) || 0;
  if (!(percent > 0 && percent < 100) || fare <= 0) {
    return { chargeAmount: fare, depositDue: 0, balanceDue: 0, depositPercent: 0 };
  }
  const chargeAmount = roundMoney((fare * percent) / 100);
  if (!(chargeAmount > 0 && chargeAmount < fare)) {
    return { chargeAmount: fare, depositDue: 0, balanceDue: 0, depositPercent: 0 };
  }
  return {
    chargeAmount,
    depositDue: chargeAmount,
    balanceDue: roundMoney(fare - chargeAmount),
    depositPercent: percent,
  };
}

/** True when the client total is too far from the server charge to accept. */
export function chargeDrift(clientAmount: number | undefined, chargeAmount: number) {
  if (typeof clientAmount !== "number" || !(clientAmount > 0)) return false;
  return Math.abs(clientAmount - chargeAmount) > Math.max(5, chargeAmount * 0.15);
}
