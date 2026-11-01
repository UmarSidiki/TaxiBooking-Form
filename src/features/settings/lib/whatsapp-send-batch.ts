import type { WASocket } from "@whiskeysockets/baileys";

import { waitForSendSlot } from "@/features/settings/lib/whatsapp-rate-limit";
import {
  normaliseJid,
  resolveJidAliases,
} from "@/features/settings/lib/whatsapp-jid";
import {
  claimWhatsAppSend,
  markWhatsAppSend,
} from "@/features/settings/lib/whatsapp-send-log";
import type {
  WhatsAppSendKind,
  WhatsAppSendStatus,
} from "@/features/settings/model/WhatsAppSendLog";
import type {
  WhatsAppOutbound,
  WhatsAppSendOptions,
  WhatsAppSendResult,
} from "@/features/settings/lib/whatsapp-send";

const DEFAULT_JITTER_MIN_MS = 400;
const DEFAULT_JITTER_MAX_MS = 1_500;

function jitterDelay(rng: () => number, minMs: number, maxMs: number) {
  return minMs + Math.floor(rng() * (maxMs - minMs + 1));
}

function failure(jid: string, error: string, aliases: string[] = [jid]): WhatsAppSendResult {
  return { jid, ok: false, error, aliases };
}

async function settle(
  idempotencyKey: string,
  status: WhatsAppSendStatus,
  detail: { waMessageId?: string; error?: string } = {},
) {
  try {
    await markWhatsAppSend(idempotencyKey, status, detail);
  } catch (error) {
    console.error("WhatsApp send log failed:", error instanceof Error ? error.name : "error");
  }
}

function generatedKey(kind: WhatsAppSendKind, jid: string, index: number) {
  const nonce = Math.random().toString(36).slice(2, 10);
  return `${kind}:${jid}:${Date.now()}:${index}:${nonce}`;
}

export async function runWhatsAppBatch(input: {
  sock: WASocket;
  messages: WhatsAppOutbound[];
  options: WhatsAppSendOptions;
  kind: WhatsAppSendKind;
  deadline: number;
  cap: number;
  used: number;
  sendRateLimit: number;
  sleep: (ms: number) => Promise<void>;
}): Promise<WhatsAppSendResult[]> {
  const { sock, messages, options, kind, deadline, cap, sleep } = input;
  let used = input.used;
  const results: WhatsAppSendResult[] = [];

  for (const [index, message] of messages.entries()) {
    const jid = normaliseJid(message.jid);
    const aliases = await resolveJidAliases(sock, jid);
    const key = options.idempotencyKeys?.[index] ?? generatedKey(kind, jid, index);
    const claim = await claimWhatsAppSend({ idempotencyKey: key, jid, kind });
    if (!claim.claimed) {
      results.push({
        jid,
        ok: claim.status === "sent",
        status: claim.status,
        ...(claim.status === "sent" ? {} : { error: "duplicate" }),
        aliases,
      });
      continue;
    }

    if (Date.now() >= deadline) {
      await settle(key, "failed", { error: "deadline" });
      results.push(failure(jid, "deadline", aliases));
      continue;
    }
    if (cap > 0 && used >= cap) {
      await settle(key, "capped");
      results.push(failure(jid, "capped", aliases));
      continue;
    }

    const minMs = options.jitterMinMs ?? DEFAULT_JITTER_MIN_MS;
    const maxMs = options.jitterMaxMs ?? DEFAULT_JITTER_MAX_MS;
    const skipJitter = kind === "otp" && index === 0;
    if (!skipJitter) {
      const delay = jitterDelay(options.rng ?? Math.random, minMs, maxMs);
      if (Date.now() + delay < deadline) await sleep(delay);
    }
    if (Date.now() >= deadline) {
      await settle(key, "failed", { error: "deadline" });
      results.push(failure(jid, "deadline", aliases));
      continue;
    }

    await waitForSendSlot(input.sendRateLimit);
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
      await settle(key, "sent", { waMessageId: sent?.key?.id ?? undefined });
      results.push({ jid, ok: true, aliases });
    } catch {
      await settle(key, "failed", { error: "send_failed" });
      results.push(failure(jid, "send_failed", aliases));
    }
  }

  return results;
}
