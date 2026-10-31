import { beforeEach, describe, expect, it, vi } from "vitest";

import { WhatsAppConfig, WhatsAppSendLog } from "@/features/settings/model";

const h = vi.hoisted(() => {
  const sock = {
    sendMessage: vi.fn(),
    end: vi.fn().mockResolvedValue(undefined),
    ev: { on: vi.fn(), off: vi.fn() },
  };
  const flushCreds = vi.fn(async () => undefined);
  return {
    sock,
    flushCreds,
    open: vi.fn(async () => ({
      sock,
      linked: true,
      flushCreds,
    })),
  };
});

vi.mock("@/features/settings/lib/whatsapp-socket", () => ({
  openWhatsAppSocket: h.open,
  waitForOpen: vi.fn(async () => undefined),
  isLoggedOut: () => false,
  WHATSAPP_OPEN_TIMEOUT_MS: 10_000,
}));

import { sendWhatsAppTexts, type WhatsAppSendResult } from "@/features/settings/lib/whatsapp-send";

const messages = [
  { jid: "14155552671@s.whatsapp.net", text: "first" },
  { jid: "14155552672@s.whatsapp.net", text: "second" },
];

beforeEach(() => {
  h.sock.sendMessage.mockReset();
  h.sock.sendMessage.mockResolvedValue({ key: { id: "wa-1" } });
  h.sock.end.mockClear();
  h.open.mockClear();
  h.open.mockImplementation(async () => ({
    sock: h.sock,
    linked: true,
    flushCreds: h.flushCreds,
  }));
});

describe("WhatsApp batch sending", () => {
  it("reuses one socket for the batch and fails the rest at the deadline", async () => {
    h.sock.sendMessage.mockImplementationOnce(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { key: { id: "wa-1" } };
    });

    const result = await sendWhatsAppTexts(messages, {
      deadlineMs: 200,
      sleep: async () => undefined,
    });

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
    h.open.mockResolvedValueOnce({
      sock: h.sock,
      linked: false,
      flushCreds: h.flushCreds,
    });

    const result = await sendWhatsAppTexts([messages[0]]);

    expect(result).toEqual({ ok: false, reason: "needs_scan" });
    expect(h.sock.sendMessage).not.toHaveBeenCalled();
    expect(h.sock.end).toHaveBeenCalled();
  });

  it("jitters between messages but not before the first OTP", async () => {
    const sleeps: number[] = [];
    const sleep = async (ms: number) => {
      sleeps.push(ms);
    };

    await sendWhatsAppTexts(messages, { kind: "otp", rng: () => 0, sleep });
    expect(sleeps).toEqual([400]);

    sleeps.length = 0;
    await sendWhatsAppTexts(messages, { kind: "notification", rng: () => 0, sleep });
    expect(sleeps).toEqual([400, 400]);
    expect(h.sock.sendMessage).toHaveBeenCalledTimes(4);
  });

  it("stops at the daily cap counted from the send log", async () => {
    await WhatsAppConfig.create({ enabled: true, dailyCap: 1 });
    await WhatsAppSendLog.create({
      idempotencyKey: "sent-today",
      jid: "14155552671@s.whatsapp.net",
      kind: "otp",
      status: "sent",
      attempts: 1,
    });

    const result = await sendWhatsAppTexts(messages, {
      sleep: async () => undefined,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [first, second] = result.results as WhatsAppSendResult[];
    expect(first?.error).toBe("capped");
    expect(second?.error).toBe("capped");
    expect(h.sock.sendMessage).not.toHaveBeenCalled();
    const capped = await WhatsAppSendLog.countDocuments({ status: "capped" });
    expect(capped).toBe(2);
  });
});
