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
import {
  jidMatches,
  normaliseJid,
  resolveJidAliases,
} from "@/features/settings/lib/whatsapp-jid";
import {
  countWhatsAppSendsToday,
  DEFAULT_WHATSAPP_DAILY_CAP,
  recordWhatsAppSend,
} from "@/features/settings/lib/whatsapp-send-log";
import type { WhatsAppSendKind } from "@/features/settings/model/WhatsAppSendLog";

export type WhatsAppOutbound = {
  jid: string;
  text: string;
  document?: { base64: string; fileName: string };
};

export type WhatsAppSendResult = {
  jid: string;
  ok: boolean;
  error?: string;
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
  rng?: () => number;
  sleep?: (ms: number) => Promise<void>;
};

export type WhatsAppSendOutcome =
  | { ok: true; results: WhatsAppSendResult[] }
  | { ok: false; reason: "needs_scan" | "failed" };

const JITTER_MIN_MS = 400;
const JITTER_MAX_MS = 1_500;

function jitterDelay(rng: () => number) {
  return JITTER_MIN_MS + Math.floor(rng() * (JITTER_MAX_MS - JITTER_MIN_MS + 1));
}

function failure(jid: string, error: string, aliases: string[] = [jid]): WhatsAppSendResult {
  return { jid, ok: false, error, aliases };
}

async function logSend(input: {
  jid: string;
  kind: WhatsAppSendKind;
  status: "sent" | "failed" | "capped";
  waMessageId?: string;
  error?: string;
}) {
  try {
    await recordWhatsAppSend(input);
  } catch (error) {
    console.error("WhatsApp send log failed:", error instanceof Error ? error.name : "error");
  }
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
    const kind = options.kind ?? "other";
    const sleep = options.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
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
        .select("sendRateLimit dailyCap")
        .lean<{ sendRateLimit?: number; dailyCap?: number }>();
      const cap = config?.dailyCap ?? DEFAULT_WHATSAPP_DAILY_CAP;
      let used = cap > 0 ? await countWhatsAppSendsToday() : 0;
      const results: WhatsAppSendResult[] = [];

      for (const [index, message] of messages.entries()) {
        const jid = normaliseJid(message.jid);
        const aliases = await resolveJidAliases(sock, jid);
        if (Date.now() >= deadline) {
          await logSend({ jid, kind, status: "failed", error: "deadline" });
          results.push(failure(jid, "deadline", aliases));
          continue;
        }
        if (cap > 0 && used >= cap) {
          await logSend({ jid, kind, status: "capped" });
          results.push(failure(jid, "capped", aliases));
          continue;
        }

        const skipJitter = kind === "otp" && index === 0;
        if (!skipJitter) {
          const delay = jitterDelay(options.rng ?? Math.random);
          if (Date.now() + delay < deadline) await sleep(delay);
        }
        if (Date.now() >= deadline) {
          await logSend({ jid, kind, status: "failed", error: "deadline" });
          results.push(failure(jid, "deadline", aliases));
          continue;
        }

        await waitForSendSlot(config?.sendRateLimit ?? 0);
        try {
          const sent = await sock.sendMessage(
            jid,
            message.document
              ? {
                  document: Buffer.from(message.document.base64, "base64"),
                  mimetype: "application/pdf",
                  fileName: message.document.fileName,
                  caption: message.text,
                }
              : { text: message.text },
          );
          const receiptJid = sent?.key?.remoteJid;
          if (receiptJid) aliases.push(normaliseJid(receiptJid));
          used += 1;
          await logSend({ jid, kind, status: "sent", waMessageId: sent?.key?.id ?? undefined });
          results.push({ jid, ok: true, aliases });
        } catch {
          await logSend({ jid, kind, status: "failed", error: "send_failed" });
          results.push(failure(jid, "send_failed", aliases));
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
