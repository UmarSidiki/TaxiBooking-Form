import { describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => {
  const sock = {
    sendMessage: vi.fn(),
    end: vi.fn().mockResolvedValue(undefined),
    ev: { on: vi.fn(), off: vi.fn() },
  };
  return {
    sock,
    open: vi.fn(async () => ({
      sock,
      linked: true,
      flushCreds: vi.fn(async () => undefined),
    })),
  };
});

vi.mock("@/features/settings/lib/whatsapp-socket", () => ({
  openWhatsAppSocket: h.open,
  waitForOpen: vi.fn(async () => undefined),
  isLoggedOut: () => false,
  WHATSAPP_OPEN_TIMEOUT_MS: 10_000,
}));

import { sendWhatsAppTexts } from "@/features/settings/lib/whatsapp-send";

describe("WhatsApp batch sending", () => {
  it("reuses one socket for the batch and fails the rest at the deadline", async () => {
    h.sock.sendMessage.mockImplementationOnce(async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
      return { key: { id: "wa-1" } };
    });

    const result = await sendWhatsAppTexts(
      [
        { jid: "14155552671@s.whatsapp.net", text: "first" },
        { jid: "14155552672@s.whatsapp.net", text: "second" },
      ],
      { deadlineMs: 30 },
    );

    expect(h.open).toHaveBeenCalledTimes(1);
    expect(h.sock.sendMessage).toHaveBeenCalledTimes(1);
    expect(h.sock.end).toHaveBeenCalled();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.results).toEqual([
      {
        jid: "14155552671@s.whatsapp.net",
        ok: true,
        aliases: ["14155552671@s.whatsapp.net"],
      },
      {
        jid: "14155552672@s.whatsapp.net",
        ok: false,
        error: "deadline",
        aliases: ["14155552672@s.whatsapp.net"],
      },
    ]);
  });

  it("opens no socket when the service is not linked", async () => {
    h.sock.sendMessage.mockReset();
    h.open.mockResolvedValueOnce({
      sock: h.sock,
      linked: false,
      flushCreds: vi.fn(async () => undefined),
    });

    const result = await sendWhatsAppTexts([{ jid: "14155552671@s.whatsapp.net", text: "hi" }]);

    expect(result).toEqual({ ok: false, reason: "needs_scan" });
    expect(h.sock.sendMessage).not.toHaveBeenCalled();
    expect(h.sock.end).toHaveBeenCalled();
  });
});
