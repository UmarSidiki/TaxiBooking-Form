let nextSlot = 0;

/** Space outbound WhatsApp messages when the desk sets a per-minute limit. */
export async function waitForSendSlot(perMinute: number) {
  if (!Number.isFinite(perMinute) || perMinute <= 0) return;
  const gap = Math.ceil(60_000 / perMinute);
  const now = Date.now();
  const wait = Math.max(0, nextSlot - now);
  nextSlot = Math.max(now, nextSlot) + gap;
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
}
