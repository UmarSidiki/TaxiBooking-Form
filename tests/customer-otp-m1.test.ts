import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import { sendCustomerOtp, verifyCustomerOtp } from "@/features/customers/lib/customer-otp";
import CustomerOtp from "@/features/customers/model/CustomerOtp";
import CustomerProfile from "@/features/customers/model/CustomerProfile";
import { createRide } from "./helpers/fixtures";

const mocks = vi.hoisted(() => ({ notify: vi.fn() }));

vi.mock("@/features/notifications/notify", () => ({ notify: mocks.notify }));

afterAll(() => {
  vi.doUnmock("@/features/notifications/notify");
  vi.resetModules();
});

function deliveriesFor(channels: readonly string[]) {
  return channels.map((channel) => ({ channel, audience: "customer", to: "someone" }));
}

function lastCode() {
  const calls = mocks.notify.mock.calls;
  const ctx = calls.at(-1)?.[1] as { variables?: { code?: string } } | undefined;
  return ctx?.variables?.code ?? "";
}

function lastChannels() {
  const calls = mocks.notify.mock.calls;
  const ctx = calls.at(-1)?.[1] as { channels?: readonly string[] } | undefined;
  return ctx?.channels ?? [];
}

async function knownCustomer(email: string) {
  await createRide({ selectedVehicle: new mongoose.Types.ObjectId(), email });
}

let ipSeq = 0;
function sendRequest(body: unknown) {
  ipSeq += 1;
  return new Request("http://local/api/account/otp", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `203.0.113.${ipSeq}` },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  process.env.NEXTAUTH_SECRET = "test-secret";
  mocks.notify.mockReset();
  mocks.notify.mockImplementation(async (_event: string, ctx: { channels?: readonly string[] }) => ({
    ok: true,
    queued: 0,
    skipped: null,
    deliveries: deliveriesFor(ctx.channels ?? []),
  }));
});

describe("customer OTP (M1)", () => {
  it("rejects an email plus an arbitrary phone and sends nothing", async () => {
    const { POST } = await import("@/app/api/account/otp/route");
    const response = await POST(
      sendRequest({ email: "victim@example.com", phone: "+14155552671" }),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("invalid_body");
    expect(mocks.notify).not.toHaveBeenCalled();
    expect(await CustomerOtp.countDocuments({})).toBe(0);
  });

  it("emails a code to a known customer", async () => {
    await knownCustomer("known@example.com");
    const result = await sendCustomerOtp("known@example.com");
    expect(result.ok).toBe(true);
    expect(lastChannels()).toEqual(["email"]);
    expect(lastCode()).toMatch(/^\d{6}$/);
  });

  it("falls back to email for the whatsapp channel when no verified phone exists", async () => {
    await knownCustomer("nophone@example.com");
    const result = await sendCustomerOtp("nophone@example.com", "whatsapp");
    expect(result.ok).toBe(true);
    expect(lastChannels()).toEqual(["email"]);
    expect(mocks.notify.mock.calls.every(([, ctx]) => !(ctx as { channels?: string[] }).channels?.includes("whatsapp"))).toBe(true);
  });

  it("accepts a code only once", async () => {
    await knownCustomer("once@example.com");
    await sendCustomerOtp("once@example.com");
    const code = lastCode();
    expect((await verifyCustomerOtp("once@example.com", code)).ok).toBe(true);
    expect((await verifyCustomerOtp("once@example.com", code)).ok).toBe(false);
  });

  it("rejects an expired code", async () => {
    await knownCustomer("expired@example.com");
    await sendCustomerOtp("expired@example.com");
    const code = lastCode();
    await CustomerOtp.updateMany({ email: "expired@example.com" }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    const result = await verifyCustomerOtp("expired@example.com", code);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("expired");
  });

  it("blocks the sixth wrong guess", async () => {
    await knownCustomer("guess@example.com");
    await sendCustomerOtp("guess@example.com");
    const right = lastCode();
    const wrong = right === "000000" ? "111111" : "000000";
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const result = await verifyCustomerOtp("guess@example.com", wrong);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBe("invalid_code");
    }
    const blocked = await verifyCustomerOtp("guess@example.com", wrong);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error).toBe("rate_limited");
  });

  it("blocks the sixth send within an hour", async () => {
    await knownCustomer("many@example.com");
    for (let send = 0; send < 5; send += 1) {
      expect((await sendCustomerOtp("many@example.com")).ok).toBe(true);
    }
    const blocked = await sendCustomerOtp("many@example.com");
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.error).toBe("rate_limited");
      expect(blocked.retryAfter).toBeGreaterThan(0);
    }
  });

  it("delivers the whatsapp channel to the verified phone of that email", async () => {
    await knownCustomer("verified@example.com");
    await CustomerProfile.create({ email: "verified@example.com", verifiedPhone: "+14155552671" });
    await sendCustomerOtp("verified@example.com", "whatsapp");
    expect(lastChannels()).toEqual(["whatsapp"]);
    const ctx = mocks.notify.mock.calls.at(-1)?.[1] as {
      recipients?: { customer?: { phone?: string }[] };
    };
    expect(ctx.recipients?.customer?.[0]?.phone).toBe("+14155552671");
  });
});
