export type DepositMethod = "card" | "multisafepay" | "cash" | "appointment";

export type RuleLike = {
  depositPercent?: number | null;
  cashDepositEnabled?: boolean | null;
  cashDepositPercent?: number | null;
  appointmentDepositEnabled?: boolean | null;
  appointmentDepositPercent?: number | null;
};

export type DepositConfig = {
  cash: { enabled: boolean; percent: number };
  appointment: { enabled: boolean; percent: number };
};

export function depositConfigFromRule(rule: RuleLike | null | undefined): DepositConfig {
  return {
    cash: {
      enabled: Boolean(rule?.cashDepositEnabled),
      percent: Number(rule?.cashDepositPercent) || 0,
    },
    appointment: {
      enabled: Boolean(rule?.appointmentDepositEnabled),
      percent: Number(rule?.appointmentDepositPercent) || 0,
    },
  };
}

/** Which deposit percentage applies for the chosen payment method. */
export function depositPercentForMethod(
  rule: RuleLike | null | undefined,
  method: DepositMethod | undefined,
): number {
  if (method === "cash") {
    return rule?.cashDepositEnabled ? Number(rule.cashDepositPercent) || 0 : 0;
  }
  if (method === "appointment") {
    return rule?.appointmentDepositEnabled
      ? Number(rule.appointmentDepositPercent) || 0
      : 0;
  }
  return Number(rule?.depositPercent) || 0;
}
