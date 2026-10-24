import type { WhatsAppOutbound } from "@/features/settings/lib/whatsapp-session";

type GlobalOutbox = { __qaWhatsAppOutbox?: WhatsAppOutbound[] };

export function qaWhatsAppMockEnabled() {
  return process.env.QA_MOCK_WHATSAPP === "1";
}

function bucket() {
  const g = globalThis as GlobalOutbox;
  g.__qaWhatsAppOutbox ??= [];
  return g.__qaWhatsAppOutbox;
}

export function pushWhatsAppOutbox(messages: WhatsAppOutbound[]) {
  bucket().push(...messages);
}

export function readWhatsAppOutbox() {
  return bucket().slice();
}

export function clearWhatsAppOutbox() {
  bucket().length = 0;
}
