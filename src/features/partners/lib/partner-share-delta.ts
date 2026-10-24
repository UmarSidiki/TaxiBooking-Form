export function roundMoney(amount: number) {
  return Math.round(amount * 100) / 100;
}

/** Signed balance change for one completed ride. Positive means the operator owes the partner. */
export function partnerShareDelta(input: {
  isCash: boolean;
  cashMode: "keep_cash" | "operator_margin";
  partnerShare: number;
  margin: number;
}) {
  if (!input.isCash) return roundMoney(Math.max(0, input.partnerShare));
  if (input.cashMode === "operator_margin") return roundMoney(-Math.max(0, input.margin));
  return 0;
}

export function readPartnerBalance(partner: {
  balance?: number | null;
  payoutBalance?: number | null;
  remittanceBalance?: number | null;
} | null) {
  if (!partner) return 0;
  if (typeof partner.balance === "number") return roundMoney(partner.balance);
  return roundMoney((partner.payoutBalance ?? 0) - (partner.remittanceBalance ?? 0));
}
