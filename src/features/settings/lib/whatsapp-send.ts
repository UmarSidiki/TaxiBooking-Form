import { withWhatsAppLock } from "@/features/settings/lib/whatsapp-lock";
import { WhatsAppConfig } from "@/features/settings/model";
import { pushWhatsAppOutbox, qaWhatsAppMockEnabled } from "@/features/settings/lib/whatsapp-outbox";
import { waitForSendSlot } from "@/features/settings/lib/whatsapp-rate-limit";
import {
  isLoggedOut,
  openWhatsAppSocket,
  waitForOpen,
  WHATSAPP_OPEN_TIMEOUT_MS,
} from "@/features/settings/lib/whatsapp-socket";
import { WHATSAPP_DEFAULT_SEND_BUDGET_MS } from "@/features/settings/lib/whatsapp-deadline";

export type WhatsAppOutbound = {
  jid: string;
  text: string;
  document?: { base64: string; fileName: string };
};

export type WhatsAppSendResult = { jid: string; ok: boolean; error?: string };

export type WhatsAppSendOptions = {
  /** Wall-clock budget for the whole batch, measured from the call. */
  deadlineMs?: number;
};

export type WhatsAppSendOutcome =
  | { ok: true; results: WhatsAppSendResult[] }
  | { ok: false; reason: "needs_scan" | "failed" };

function failure(jid: string, error: string): WhatsAppSendResult {
  return { jid, ok: false, error };
}

export function sendWhatsAppTexts(
  messages: WhatsAppOutbound[],
  options: WhatsAppSendOptions = {},
): Promise<WhatsAppSendOutcome> {
  if (qaWhatsAppMockEnabled()) {
    pushWhatsAppOutbox(messages);
    return Promise.resolve({
      ok: true as const,
      results: messages.map((message) => ({ jid: message.jid, ok: true })),
    });
  }
  return withWhatsAppLock(async (): Promise<WhatsAppSendOutcome> => {
    const deadline = Date.now() + (options.deadlineMs ?? WHATSAPP_DEFAULT_SEND_BUDGET_MS);
    const { sock, linked, flushCreds } = await openWhatsAppSocket();
    if (!linked) {
      await flushCreds().catch(() => undefined);
      await sock.end(undefined).catch(() => undefined);
      return { ok: false, reason: "needs_scan" };
    }

    try {
      const remaining = Math.max(1_000, Math.min(WHATSAPP_OPEN_TIMEOUT_MS, deadline - Date.now()));
      await waitForOpen(sock, remaining);
      const config = await WhatsAppConfig.findOne()
        .select("sendRateLimit")
        .lean<{ sendRateLimit?: number }>();
      const results: WhatsAppSendResult[] = [];
      for (const message of messages) {
        if (Date.now() >= deadline) {
          results.push(failure(message.jid, "deadline"));
          continue;
        }
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
          results.push(failure(message.jid, "send_failed"));
        }
      }
      return { ok: true, results };
    } catch (error) {
      if (isLoggedOut(error)) {
        const { clearWhatsAppAuth } = await import("@/features/settings/lib/whatsapp-mongo-auth");
        await clearWhatsAppAuth();
      }
      return { ok: false, reason: isLoggedOut(error) ? "needs_scan" : "failed" };
    } finally {
      await flushCreds().catch(() => undefined);
      await sock.end(undefined).catch(() => undefined);
    }
  });
}
