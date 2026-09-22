import { rm } from "node:fs/promises";
import QRCode from "qrcode";

import { withWhatsAppLock } from "@/features/settings/lib/whatsapp-lock";
import {
  WHATSAPP_AUTH_DIR,
  isLoggedOut,
  openWhatsAppSocket,
  readWhatsAppRegistered,
  waitForOpen,
} from "@/features/settings/lib/whatsapp-socket";

export type WhatsAppLinkView = {
  status: "needs_scan" | "waiting" | "linked" | "failed";
  qrDataUrl: string | null;
};

export type WhatsAppOutbound = {
  jid: string;
  text: string;
};

type SendResult =
  | { ok: true; results: { jid: string; ok: boolean }[] }
  | { ok: false; reason: "needs_scan" | "failed" };

let linkView: WhatsAppLinkView = { status: "needs_scan", qrDataUrl: null };
let pairing: Promise<void> | null = null;

export function peekWhatsAppLink() {
  return linkView;
}

export async function currentWhatsAppLink(): Promise<WhatsAppLinkView> {
  if (linkView.status === "waiting") return linkView;
  const registered = await readWhatsAppRegistered();
  linkView = { status: registered ? "linked" : "needs_scan", qrDataUrl: null };
  return linkView;
}

export function startWhatsAppPairing() {
  if (!pairing) {
    linkView = { status: "waiting", qrDataUrl: null };
    pairing = withWhatsAppLock(runPair).finally(() => {
      pairing = null;
    });
  }
  return linkView;
}

async function runPair() {
  if (await readWhatsAppRegistered()) {
    linkView = { status: "linked", qrDataUrl: null };
    return;
  }

  const { sock } = await openWhatsAppSocket();
  let settled = false;
  const finish = async (next: WhatsAppLinkView) => {
    if (settled) return;
    settled = true;
    linkView = next;
    await sock.end(undefined).catch(() => undefined);
  };

  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      void finish({ status: "failed", qrDataUrl: null }).finally(resolve);
    }, 60_000);

    sock.ev.on("connection.update", (update) => {
      if (update.qr) {
        void QRCode.toDataURL(update.qr).then((qrDataUrl) => {
          if (!settled) linkView = { status: "waiting", qrDataUrl };
        });
      }
      if (update.connection === "open") {
        clearTimeout(timer);
        void finish({ status: "linked", qrDataUrl: null }).finally(resolve);
      } else if (update.connection === "close") {
        clearTimeout(timer);
        const status = isLoggedOut(update.lastDisconnect?.error) ? "needs_scan" : "failed";
        void finish({ status, qrDataUrl: null }).finally(resolve);
      }
    });
  });
}

export function sendWhatsAppTexts(messages: WhatsAppOutbound[]) {
  return withWhatsAppLock(async (): Promise<SendResult> => {
    const { sock, registered } = await openWhatsAppSocket();
    if (!registered) {
      await sock.end(undefined).catch(() => undefined);
      linkView = { status: "needs_scan", qrDataUrl: null };
      return { ok: false, reason: "needs_scan" };
    }

    try {
      await waitForOpen(sock, 20_000);
      const results = await Promise.all(
        messages.map(async (message) => {
          try {
            await sock.sendMessage(message.jid, { text: message.text });
            return { jid: message.jid, ok: true };
          } catch {
            return { jid: message.jid, ok: false };
          }
        })
      );
      return { ok: true, results };
    } catch (error) {
      if (isLoggedOut(error)) linkView = { status: "needs_scan", qrDataUrl: null };
      return { ok: false, reason: isLoggedOut(error) ? "needs_scan" : "failed" };
    } finally {
      await sock.end(undefined).catch(() => undefined);
    }
  });
}

export function unlinkWhatsApp() {
  return withWhatsAppLock(async () => {
    if (await readWhatsAppRegistered()) {
      const { sock } = await openWhatsAppSocket();
      try {
        await waitForOpen(sock, 20_000);
        await sock.logout();
      } catch (error) {
        console.error("WhatsApp unlink failed:", error);
      } finally {
        await sock.end(undefined).catch(() => undefined);
      }
    }
    await rm(WHATSAPP_AUTH_DIR, { recursive: true, force: true });
    linkView = { status: "needs_scan", qrDataUrl: null };
  });
}
