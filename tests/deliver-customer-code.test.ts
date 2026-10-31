import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ send: vi.fn(), notify: vi.fn() }));

vi.mock("@/features/settings/lib/whatsapp-send", () => ({ sendWhatsAppTexts: mocks.send }));
vi.mock("@/features/notifications/notify", () => ({ notify: mocks.notify }));

afterAll(() => {
  vi.doUnmock("@/features/settings/lib/whatsapp-send");
  vi.doUnmock("@/features/notifications/notify");
  vi.resetModules();
});

const input = { email: "ada@example.com", code: "123456", verifiedPhone: "+14155552671" };

async function deliver(
  payload: { email: string; code: string; verifiedPhone?: string | null },
  deps?: { timeoutMs?: number },
) {
  const { deliverCustomerCode } = await import("@/features/customers/lib/deliver-customer-code");
  return deliverCustomerCode(payload, deps);
}

beforeEach(() => {
  vi.resetModules();
  mocks.send.mockReset();
  mocks.notify.mockReset();
  mocks.notify.mockResolvedValue({ ok: true, queued: 0, skipped: null, deliveries: [] });
});

describe("customer code delivery", () => {
  it("uses WhatsApp and skips email on success", async () => {
    mocks.send.mockResolvedValue({ ok: true, results: [{ jid: "14155552671@s.whatsapp.net", ok: true }] });
    expect(await deliver(input)).toBe("whatsapp");
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it("falls back to email when the sender reports failed", async () => {
    mocks.send.mockResolvedValue({ ok: false, reason: "failed" });
    expect(await deliver(input)).toBe("email");
    expect(mocks.notify).toHaveBeenCalledWith("sign_in_otp", expect.objectContaining({ channels: ["email"] }));
  });

  it("falls back to email when the sender needs a scan", async () => {
    mocks.send.mockResolvedValue({ ok: false, reason: "needs_scan" });
    expect(await deliver(input)).toBe("email");
    expect(mocks.notify).toHaveBeenCalledTimes(1);
  });

  it("falls back to email when one message is not ok", async () => {
    mocks.send.mockResolvedValue({ ok: true, results: [{ jid: "14155552671@s.whatsapp.net", ok: false }] });
    expect(await deliver(input)).toBe("email");
    expect(mocks.notify).toHaveBeenCalledTimes(1);
  });

  it("falls back to email when WhatsApp times out", async () => {
    mocks.send.mockReturnValue(new Promise(() => undefined));
    expect(await deliver(input, { timeoutMs: 5 })).toBe("email");
    expect(mocks.notify).toHaveBeenCalledTimes(1);
  });

  it("goes straight to email without a verified phone", async () => {
    expect(await deliver({ email: "ada@example.com", code: "123456" })).toBe("email");
    expect(mocks.send).not.toHaveBeenCalled();
  });
});
