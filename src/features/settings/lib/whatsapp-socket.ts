import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { ConnectionState, WASocket } from "@whiskeysockets/baileys";
import pino from "pino";

export const WHATSAPP_AUTH_DIR = path.join(process.cwd(), "data", "whatsapp-auth");

const logger = pino({ level: "silent" });

export async function openWhatsAppSocket() {
  const baileys = await import("@whiskeysockets/baileys");
  await mkdir(WHATSAPP_AUTH_DIR, { recursive: true });
  const { state, saveCreds } = await baileys.useMultiFileAuthState(WHATSAPP_AUTH_DIR);
  const sock = baileys.makeWASocket({
    auth: state,
    logger,
    syncFullHistory: false,
    markOnlineOnConnect: false,
    shouldSyncHistoryMessage: () => false,
  });
  sock.ev.on("creds.update", saveCreds);
  return { sock, registered: state.creds.registered };
}

export async function readWhatsAppRegistered() {
  const baileys = await import("@whiskeysockets/baileys");
  await mkdir(WHATSAPP_AUTH_DIR, { recursive: true });
  const { state } = await baileys.useMultiFileAuthState(WHATSAPP_AUTH_DIR);
  return state.creds.registered;
}

export function waitForOpen(sock: WASocket, timeoutMs: number) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("timeout"));
    }, timeoutMs);

    const onUpdate = (update: Partial<ConnectionState>) => {
      if (update.connection === "open") {
        cleanup();
        resolve();
      } else if (update.connection === "close") {
        cleanup();
        reject(update.lastDisconnect?.error ?? new Error("closed"));
      }
    };

    const cleanup = () => {
      clearTimeout(timer);
      sock.ev.off("connection.update", onUpdate);
    };

    sock.ev.on("connection.update", onUpdate);
  });
}

export function isLoggedOut(error: unknown) {
  if (!error || typeof error !== "object" || !("output" in error)) return false;
  const output = (error as { output?: { statusCode?: number } }).output;
  return output?.statusCode === 401;
}
