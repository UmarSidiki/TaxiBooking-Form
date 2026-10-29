/** Explicit gate: a card PaymentIntent is only opened after the visitor picks card. */
export function shouldOpenCardSession(input: {
  method: string;
  appointmentOnly: boolean;
  enabled: boolean;
  quoteReady: boolean;
  dueNow: number;
  hasSecret: boolean;
  creating: boolean;
  initialized: boolean;
}) {
  if (input.appointmentOnly) return false;
  if (input.method !== "card") return false;
  if (!input.enabled || !input.quoteReady || input.dueNow <= 0) return false;
  if (input.hasSecret || input.creating || input.initialized) return false;
  return true;
}
