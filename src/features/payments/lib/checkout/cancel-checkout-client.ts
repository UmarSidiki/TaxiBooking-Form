const CANCEL_TIMEOUT_MS = 8_000;

export type CheckoutCancelQueue = {
  /** Queues a scoped cancel; resolves once it and everything before it ran. */
  cancel(draftId: string, paymentIntentId: string): Promise<void>;
  /** Awaits every queued cancel, so a new session cannot race one. */
  wait(): Promise<void>;
};

/**
 * Serializes abandon requests for one checkout draft.
 *
 * The PaymentIntent id goes with the request so the server can ignore a late
 * cancel that belongs to an older method or tab instead of cancelling the
 * intent a newer session just handed to Elements ("terminal state" error).
 * A timeout keeps a stalled cancel from blocking the next checkout attempt.
 */
export function createCheckoutCancelQueue(): CheckoutCancelQueue {
  let chain: Promise<void> = Promise.resolve();

  return {
    cancel(draftId, paymentIntentId) {
      chain = chain.then(async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), CANCEL_TIMEOUT_MS);
        try {
          await fetch("/api/checkout/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ draftId, paymentIntentId }),
            signal: controller.signal,
          });
        } catch {
          // Best effort: the draft expires and is swept server-side.
        } finally {
          clearTimeout(timer);
        }
      });
      return chain;
    },
    wait() {
      return chain;
    },
  };
}
