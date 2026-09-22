import QRCode from "qrcode";

import { clearWhatsAppAuth } from "@/features/settings/lib/whatsapp-mongo-auth";
import { disconnectCode, openWhatsAppSocket } from "@/features/settings/lib/whatsapp-socket";

type LinkView = {
  status: "needs_scan" | "waiting" | "linked" | "failed";
  qrDataUrl: string | null;
};

const PAIR_MS = 90_000;
const RESTART_REQUIRED = 515;

type PairOutcome = "open" | "restart" | "logged_out" | "failed" | "timeout";

async function listenOnce(
  timeoutMs: number,
  onQr: (qrDataUrl: string) => Promise<void>
): Promise<PairOutcome> {
  const { sock, flushCreds } = await openWhatsAppSocket();
  return new Promise((resolve) => {
    let settled = false;
    const finish = (outcome: PairOutcome) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      void flushCreds()
        .catch(() => undefined)
        .finally(() => {
          void sock.end(undefined).catch(() => undefined).finally(() => resolve(outcome));
        });
    };
    const timer = setTimeout(() => finish("timeout"), timeoutMs);

    sock.ev.on("connection.update", (update) => {
      if (update.qr) {
        void QRCode.toDataURL(update.qr, { margin: 1, width: 240 })
          .then((qrDataUrl) => onQr(qrDataUrl))
          .catch((error: unknown) => {
            console.error("WhatsApp QR encode failed:", error);
          });
      }
      if (update.connection === "open") {
        finish("open");
        return;
      }
      if (update.connection !== "close") return;
      const code = disconnectCode(update.lastDisconnect?.error);
      console.error("WhatsApp connection closed:", code);
      if (code === RESTART_REQUIRED) finish("restart");
      else if (code === 401) finish("logged_out");
      else finish("failed");
    });
  });
}

export async function pairWhatsApp(publish: (next: LinkView) => Promise<void>) {
  const deadline = Date.now() + PAIR_MS;
  let sawQr = false;
  let cleared = false;

  while (Date.now() < deadline) {
    const outcome = await listenOnce(deadline - Date.now(), async (qrDataUrl) => {
      sawQr = true;
      await publish({ status: "waiting", qrDataUrl });
    });
    if (outcome === "open") {
      await publish({ status: "linked", qrDataUrl: null });
      return;
    }
    if (outcome === "restart") {
      await publish({ status: "waiting", qrDataUrl: null });
      continue;
    }
    if (outcome === "logged_out" && !sawQr && !cleared) {
      cleared = true;
      await clearWhatsAppAuth();
      continue;
    }
    await publish({
      status: outcome === "logged_out" ? "needs_scan" : "failed",
      qrDataUrl: null,
    });
    return;
  }

  await publish({ status: "failed", qrDataUrl: null });
}
