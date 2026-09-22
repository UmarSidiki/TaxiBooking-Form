import QRCode from "qrcode";

import {
  isFreshLink,
  readWhatsAppLink,
  writeWhatsAppLink,
  clearWhatsAppLink,
} from "@/features/settings/lib/whatsapp-link-store";
import { withWhatsAppLock } from "@/features/settings/lib/whatsapp-lock";
import { clearWhatsAppAuth, readWhatsAppRegistered } from "@/features/settings/lib/whatsapp-mongo-auth";
import { isLoggedOut, openWhatsAppSocket, waitForOpen } from "@/features/settings/lib/whatsapp-socket";

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

async function publish(next: WhatsAppLinkView) {
  linkView = next;
  await writeWhatsAppLink(next.status, next.qrDataUrl);
}

export async function currentWhatsAppLink(): Promise<WhatsAppLinkView> {
  const stored = await readWhatsAppLink();
  if (stored?.status === "waiting" && isFreshLink(stored)) {
    linkView = { status: "waiting", qrDataUrl: stored.qrDataUrl };
    return linkView;
  }
  const registered = await readWhatsAppRegistered();
  const failed = stored?.status === "failed" && isFreshLink(stored);
  linkView = {
    status: registered ? "linked" : failed ? "failed" : "needs_scan",
    qrDataUrl: null,
  };
  return linkView;
}

export async function startWhatsAppPairing() {
  const stored = await readWhatsAppLink();
  if (stored?.status === "waiting" && isFreshLink(stored)) {
    linkView = { status: "waiting", qrDataUrl: stored.qrDataUrl };
    return { view: linkView, done: pairing ?? Promise.resolve() };
  }
  if (!pairing) {
    linkView = { status: "waiting", qrDataUrl: null };
    pairing = withWhatsAppLock(runPair).finally(() => {
      pairing = null;
    });
  }
  return { view: linkView, done: pairing };
}

async function runPair() {
  try {
    if (await readWhatsAppRegistered()) {
      await publish({ status: "linked", qrDataUrl: null });
      return;
    }
    await publish({ status: "waiting", qrDataUrl: null });
    await pairUntilSettled();
  } catch (error) {
    console.error("WhatsApp pairing failed:", error);
    await publish({ status: "failed", qrDataUrl: null });
  }
}

async function pairUntilSettled() {
  const { sock } = await openWhatsAppSocket();
  let settled = false;
  const finish = async (next: WhatsAppLinkView) => {
    if (settled) return;
    settled = true;
    await publish(next);
    await sock.end(undefined).catch(() => undefined);
  };

  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      void finish({ status: "failed", qrDataUrl: null }).finally(resolve);
    }, 60_000);

    sock.ev.on("connection.update", (update) => {
      if (update.qr) {
        void QRCode.toDataURL(update.qr).then((qrDataUrl) => {
          if (!settled) void publish({ status: "waiting", qrDataUrl });
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
      await publish({ status: "needs_scan", qrDataUrl: null });
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
      if (isLoggedOut(error)) await publish({ status: "needs_scan", qrDataUrl: null });
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
    await clearWhatsAppAuth();
    await clearWhatsAppLink();
    linkView = { status: "needs_scan", qrDataUrl: null };
  });
}
