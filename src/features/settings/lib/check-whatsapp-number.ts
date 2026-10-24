import { readWhatsAppLinked } from "@/features/settings/lib/whatsapp-mongo-auth";
import { qaWhatsAppMockEnabled } from "@/features/settings/lib/whatsapp-outbox";
import { openWhatsAppSocket, waitForOpen } from "@/features/settings/lib/whatsapp-socket";

/** If WhatsApp is not linked, the phone is still valid and stays unverified. */
export async function checkWhatsAppNumber(e164: string) {
  if (qaWhatsAppMockEnabled()) {
    return { connected: true as const, onWhatsApp: true };
  }
  const linked = await readWhatsAppLinked();
  if (!linked) return { connected: false as const, onWhatsApp: null };

  const { sock } = await openWhatsAppSocket();
  try {
    await waitForOpen(sock, 8000);
    const jid = `${e164.replace("+", "")}@s.whatsapp.net`;
    const rows = await sock.onWhatsApp(jid);
    const onWhatsApp = Array.isArray(rows) && rows.some((row) => row.exists);
    return { connected: true as const, onWhatsApp };
  } catch {
    return { connected: true as const, onWhatsApp: null };
  } finally {
    await sock.end(undefined).catch(() => undefined);
  }
}
