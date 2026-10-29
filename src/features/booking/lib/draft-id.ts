const DRAFT_STORAGE_KEY = "booking_draft_id";

function randomUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const value = (Math.random() * 16) | 0;
    const digit = char === "x" ? value : (value & 0x3) | 0x8;
    return digit.toString(16);
  });
}

/**
 * Returns the checkout draft id for the current booking attempt.
 *
 * The id is stable across payment-method switches, retries and remounts so the
 * server can reuse the same PaymentIntent and dedupe cash bookings. It is
 * cleared once the booking is confirmed or the wizard is reset.
 */
export function getOrCreateDraftId(): string {
  if (typeof window === "undefined") return randomUuid();

  const existing = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
  if (existing) return existing;

  const draftId = randomUuid();
  window.sessionStorage.setItem(DRAFT_STORAGE_KEY, draftId);
  return draftId;
}

export function clearDraftId() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
}
