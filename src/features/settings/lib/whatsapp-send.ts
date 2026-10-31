import { withWhatsAppLock } from "@/features/settings/lib/whatsapp-lock";
import { WhatsAppConfig } from "@/features/settings/model";
import { pushWhatsAppOutbox, qaWhatsAppMockEnabled } from "@/features/settings/lib/whatsapp-outbox";
import {
  isLoggedOut,
  openWhatsAppSocket,
  waitForOpen,
  WHATSAPP_OPEN_TIMEOUT_MS,
} from "@/features/settings/lib/whatsapp-socket";
import { WHATSAPP_DEFAULT_SEND_BUDGET_MS } from "@/features/settings/lib/whatsapp-deadline";
import { writeWhatsAppLink } from "@/features/settings/lib/whatsapp-link-store";
import { jidMatches } from "@/features/settings/lib/whatsapp-jid";
import {
  countWhatsAppSendsToday,
  DEFAULT_WHATSAPP_DAILY_CAP,
} from "@/features/settings/lib/whatsapp-send-log";
import { runWhatsAppBatch } from "@/features/settings/lib/whatsapp-send-batch";
import type {
  WhatsAppSendKind,
  WhatsAppSendStatus,
} from "@/features/settings/model/WhatsAppSendLog";

export type WhatsAppOutbound = {
  jid: string;
  text: string;
  document?: { base64: string; fileName: string };
};

export type WhatsAppSendResult = {
  jid: string;
  ok: boolean;
  error?: string;
  status?: WhatsAppSendStatus;
  aliases?: string[];
};

/** Send results may come back under a LID or a device-suffixed JID. */
export function findSendResult(results: WhatsAppSendResult[], jid: string) {
  return results.find(
    (row) =>
      jidMatches(row.jid, jid) ||
      row.aliases?.some((alias) => jidMatches(alias, jid)) === true,
  );
}

export type WhatsAppSendOptions = {
  /** Wall-clock budget for the whole batch, measured from the call. */
  deadlineMs?: number;
  kind?: WhatsAppSendKind;
  /** One key per message: a retry with the same key never sends twice. */
  idempotencyKeys?: Array<string | undefined>;
  rng?: () => number;
  sleep?: (ms: number) => Promise<void>;
};

export type WhatsAppSendOutcome =
  | { ok: true; results: WhatsAppSendResult[] }
  | { ok: false; reason: "needs_scan" | "failed" };

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
    const kind = options.kind ?? "other";
    const sleep =
      options.sleep ??
      ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
    const { sock, linked, flushCreds } = await openWhatsAppSocket();
    if (!linked) {
      await flushCreds().catch(() => undefined);
      await sock.end(undefined).catch(() => undefined);
      await writeWhatsAppLink("needs_scan", null).catch(() => undefined);
      return { ok: false, reason: "needs_scan" };
    }

    try {
      const remaining = Math.max(1_000, Math.min(WHATSAPP_OPEN_TIMEOUT_MS, deadline - Date.now()));
      await waitForOpen(sock, remaining);
      const config = await WhatsAppConfig.findOne()
        .select("sendRateLimit dailyCap")
        .lean<{ sendRateLimit?: number; dailyCap?: number }>();
      const cap = config?.dailyCap ?? DEFAULT_WHATSAPP_DAILY_CAP;
      const results = await runWhatsAppBatch({
        sock,
        messages,
        options,
        kind,
        deadline,
        cap,
        used: cap > 0 ? await countWhatsAppSendsToday() : 0,
        sendRateLimit: config?.sendRateLimit ?? 0,
        sleep,
      });
      return { ok: true, results };
    } catch (error) {
      if (isLoggedOut(error)) {
        const { clearWhatsAppAuth } = await import("@/features/settings/lib/whatsapp-mongo-auth");
        await clearWhatsAppAuth();
        await writeWhatsAppLink("needs_scan", null).catch(() => undefined);
      }
      return { ok: false, reason: isLoggedOut(error) ? "needs_scan" : "failed" };
    } finally {
      await flushCreds().catch(() => undefined);
      await sock.end(undefined).catch(() => undefined);
    }
  });
}
