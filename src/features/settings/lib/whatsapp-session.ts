import {
  isFreshLink,
  readWhatsAppLink,
  writeWhatsAppLink,
  clearWhatsAppLink,
} from "@/features/settings/lib/whatsapp-link-store";
import { withWhatsAppLock } from "@/features/settings/lib/whatsapp-lock";
import { clearWhatsAppAuth, readWhatsAppLinked } from "@/features/settings/lib/whatsapp-mongo-auth";
import { pairWhatsApp } from "@/features/settings/lib/whatsapp-pair";
import { isLoggedOut, openWhatsAppSocket, waitForOpen } from "@/features/settings/lib/whatsapp-socket";
import { pushWhatsAppOutbox, qaWhatsAppMockEnabled } from "@/features/settings/lib/whatsapp-outbox";
import { WhatsAppConfig } from "@/features/settings/model";
import { waitForSendSlot } from "@/features/settings/lib/whatsapp-rate-limit";

export type WhatsAppLinkView = {
  status: "needs_scan" | "waiting" | "linked" | "failed";
  qrDataUrl: string | null;
};

export type WhatsAppOutbound = {
  jid: string;
  text: string;
  document?: { base64: string; fileName: string };
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
  if (await readWhatsAppLinked()) {
    linkView = { status: "linked", qrDataUrl: null };
    return linkView;
  }
  const stored = await readWhatsAppLink();
  if (stored?.status === "waiting" && isFreshLink(stored)) {
    linkView = { status: "waiting", qrDataUrl: stored.qrDataUrl };
    return linkView;
  }
  const failed = stored?.status === "failed" && isFreshLink(stored);
  linkView = { status: failed ? "failed" : "needs_scan", qrDataUrl: null };
  return linkView;
}

export async function startWhatsAppPairing() {
  if (await readWhatsAppLinked()) {
    await publish({ status: "linked", qrDataUrl: null });
    return { view: linkView, done: Promise.resolve() };
  }
  if (pairing) {
    return { view: linkView, done: pairing };
  }
  const stored = await readWhatsAppLink();
  if (stored?.status === "waiting" && stored.qrDataUrl && isFreshLink(stored)) {
    linkView = { status: "waiting", qrDataUrl: stored.qrDataUrl };
    return { view: linkView, done: Promise.resolve() };
  }

  await clearWhatsAppAuth();
  await publish({ status: "waiting", qrDataUrl: null });
  pairing = withWhatsAppLock(() => pairWhatsApp(publish))
    .catch(async (error: unknown) => {
      console.error("WhatsApp pairing failed:", error);
      await publish({ status: "failed", qrDataUrl: null });
    })
    .finally(() => {
      pairing = null;
    });
  return { view: linkView, done: pairing };
}

export function sendWhatsAppTexts(messages: WhatsAppOutbound[]) {
  if (qaWhatsAppMockEnabled()) {
    pushWhatsAppOutbox(messages);
    return Promise.resolve({
      ok: true as const,
      results: messages.map((message) => ({ jid: message.jid, ok: true })),
    });
  }
  return withWhatsAppLock(async (): Promise<SendResult> => {
    const { sock, linked } = await openWhatsAppSocket();
    if (!linked) {
      await sock.end(undefined).catch(() => undefined);
      await publish({ status: "needs_scan", qrDataUrl: null });
      return { ok: false, reason: "needs_scan" };
    }

    try {
      await waitForOpen(sock, 20_000);
      const config = await WhatsAppConfig.findOne()
        .select("sendRateLimit")
        .lean<{ sendRateLimit?: number }>();
      const results: { jid: string; ok: boolean }[] = [];
      for (const message of messages) {
        await waitForSendSlot(config?.sendRateLimit ?? 0);
        try {
          await sock.sendMessage(
            message.jid,
            message.document
              ? {
                  document: Buffer.from(message.document.base64, "base64"),
                  mimetype: "application/pdf",
                  fileName: message.document.fileName,
                  caption: message.text,
                }
              : { text: message.text },
          );
          results.push({ jid: message.jid, ok: true });
        } catch {
          results.push({ jid: message.jid, ok: false });
        }
      }
      return { ok: true, results };
    } catch (error) {
      if (isLoggedOut(error)) {
        await clearWhatsAppAuth();
        await publish({ status: "needs_scan", qrDataUrl: null });
      }
      return { ok: false, reason: isLoggedOut(error) ? "needs_scan" : "failed" };
    } finally {
      await sock.end(undefined).catch(() => undefined);
    }
  });
}

export function unlinkWhatsApp() {
  return withWhatsAppLock(async () => {
    if (await readWhatsAppLinked()) {
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
