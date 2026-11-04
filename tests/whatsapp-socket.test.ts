import { describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => {
  const handlers = new Map<string, Array<(...args: unknown[]) => void>>();
  const sock = {
    ev: {
      on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        const list = handlers.get(event) ?? [];
        list.push(handler);
        handlers.set(event, list);
      }),
      off: vi.fn(),
    },
    end: vi.fn().mockResolvedValue(undefined),
  };
  const wrappedKeys = { get: vi.fn(), set: vi.fn(), cached: true };
  return {
    handlers,
    sock,
    keys: { get: vi.fn(), set: vi.fn() },
    creds: { registered: true },
    saveCreds: vi.fn().mockResolvedValue(undefined),
    wrappedKeys,
    makeWASocket: vi.fn((config: Record<string, unknown>) => {
      void config;
      return sock;
    }),
    makeCacheableSignalKeyStore: vi.fn(() => wrappedKeys),
  };
});

vi.mock("@whiskeysockets/baileys", () => ({
  makeWASocket: h.makeWASocket,
  makeCacheableSignalKeyStore: h.makeCacheableSignalKeyStore,
}));

vi.mock("@/features/settings/lib/whatsapp-mongo-auth", () => ({
  loadMongoAuthState: vi.fn(async () => ({
    state: { creds: h.creds, keys: h.keys },
    saveCreds: h.saveCreds,
  })),
  whatsAppCredsLinked: () => true,
}));

import { openWhatsAppSocket, WHATSAPP_CONNECT_TIMEOUT_MS } from "@/features/settings/lib/whatsapp-socket";

describe("WhatsApp socket setup", () => {
  it("caches signal keys and uses a lean connection config", async () => {
    const { sock, flushCreds } = await openWhatsAppSocket();

    expect(h.makeCacheableSignalKeyStore).toHaveBeenCalledWith(h.keys, expect.anything());
    expect(h.makeWASocket).toHaveBeenCalledWith(
      expect.objectContaining({
        auth: { creds: h.creds, keys: h.wrappedKeys },
        connectTimeoutMs: WHATSAPP_CONNECT_TIMEOUT_MS,
        markOnlineOnConnect: false,
        syncFullHistory: false,
        shouldSyncHistoryMessage: expect.any(Function),
        fireInitQueries: false,
        generateHighQualityLinkPreview: false,
      }),
    );
    const config = h.makeWASocket.mock.calls[0]?.[0] as unknown as {
      shouldSyncHistoryMessage: () => boolean;
    };
    expect(config.shouldSyncHistoryMessage()).toBe(false);
    expect(WHATSAPP_CONNECT_TIMEOUT_MS).toBeLessThanOrEqual(10_000);

    for (const handler of h.handlers.get("creds.update") ?? []) handler();
    await flushCreds();
    expect(h.saveCreds).toHaveBeenCalled();
    expect(sock.end).not.toHaveBeenCalled();
  });
});
