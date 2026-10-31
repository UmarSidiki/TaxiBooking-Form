import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import CustomerOtp from "@/features/customers/model/CustomerOtp";
import { createRide } from "./helpers/fixtures";

const mocks = vi.hoisted(() => ({ deliver: vi.fn() }));

vi.mock("@/features/customers/lib/deliver-customer-code", () => ({
  deliverCustomerCode: mocks.deliver,
}));

afterAll(() => {
  vi.doUnmock("@/features/customers/lib/deliver-customer-code");
  vi.resetModules();
});

let ipSeq = 0;
function request(body: unknown) {
  ipSeq += 1;
  return new Request("http://local/api/account/otp", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `203.0.113.${ipSeq}` },
    body: JSON.stringify(body),
  });
}

let delivered: string[] = [];

async function sendKnown(email: string) {
  const { sendCustomerOtp } = await import("@/features/customers/lib/customer-otp");
  const result = await sendCustomerOtp(email);
  if (!result.ok) throw new Error(`send failed for ${email}`);
  await result.delivery();
  return delivered.at(-1) ?? "";
}

beforeEach(() => {
  process.env.NEXTAUTH_SECRET = "test-secret";
  delivered = [];
  mocks.deliver.mockReset();
  mocks.deliver.mockImplementation(async ({ code }: { code: string }) => {
    delivered.push(code);
    return "email";
  });
});

describe("customer OTP hardening", () => {
  it("never exceeds five attempts under ten concurrent wrong guesses", async () => {
    const { verifyCustomerOtp } = await import("@/features/customers/lib/customer-otp");
    await createRide({ selectedVehicle: new mongoose.Types.ObjectId(), email: "atomic@example.com" });
    const right = await sendKnown("atomic@example.com");
    const wrong = right === "000000" ? "111111" : "000000";

    const results = await Promise.all(
      Array.from({ length: 10 }, () => verifyCustomerOtp("atomic@example.com", wrong)),
    );
    expect(results.every((result) => !result.ok)).toBe(true);

    const row = await CustomerOtp.findOne({ email: "atomic@example.com" })
      .sort({ sentAt: -1 })
      .lean<{ attempts?: number }>();
    expect(row?.attempts).toBe(5);

    const afterwards = await verifyCustomerOtp("atomic@example.com", right);
    expect(afterwards.ok).toBe(false);
    if (!afterwards.ok) expect(afterwards.error).toBe("rate_limited");
  });

  it("accepts one correct code when verified twice concurrently", async () => {
    const { verifyCustomerOtp } = await import("@/features/customers/lib/customer-otp");
    await createRide({ selectedVehicle: new mongoose.Types.ObjectId(), email: "double@example.com" });
    const right = await sendKnown("double@example.com");

    const [first, second] = await Promise.all([
      verifyCustomerOtp("double@example.com", right),
      verifyCustomerOtp("double@example.com", right),
    ]);

    expect([first.ok, second.ok].filter(Boolean)).toHaveLength(1);
    const live = await CustomerOtp.countDocuments({
      email: "double@example.com",
      consumedAt: null,
      codeHash: { $type: "string" },
    });
    expect(live).toBe(0);
  });

  it("responds without waiting for a slow deliverer", async () => {
    await createRide({ selectedVehicle: new mongoose.Types.ObjectId(), email: "slow@example.com" });
    mocks.deliver.mockImplementation(() => new Promise(() => undefined));

    const { POST } = await import("@/app/api/account/otp/route");
    const startedAt = Date.now();
    const response = await POST(request({ email: "slow@example.com" }));
    const elapsed = Date.now() - startedAt;

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(elapsed).toBeLessThan(3000);
  });

  it("rate limits the sixth no_booking probe for the same email", async () => {
    const { POST } = await import("@/app/api/account/otp/route");

    for (let probe = 0; probe < 5; probe += 1) {
      const response = await POST(request({ email: "probe@example.com" }));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ok: false, code: "no_booking" });
    }

    const blocked = await POST(request({ email: "probe@example.com" }));
    expect(blocked.status).toBe(429);
    expect((await blocked.json()).error).toBe("rate_limited");
  });
});
