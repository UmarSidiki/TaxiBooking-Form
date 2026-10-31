import { describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import { readCustomerToken, signCustomerToken } from "@/features/customers/lib/customer-token";
import { sendCustomerOtp, verifyCustomerOtp } from "@/features/customers/lib/customer-otp";
import { changeAllowed } from "@/features/customers/lib/customer-rides";
import PricingRule from "@/features/pricing/model/PricingRule";
import { createRide } from "./helpers/fixtures";

vi.mock("@/features/notifications/notify", () => ({
  notify: vi.fn(async () => ({ ok: true, queued: 0, skipped: null, deliveries: [] })),
}));

describe("customer portal", () => {
  it("signs a magic link and rejects a bad token", () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    const token = signCustomerToken("ada@example.com", 60);
    expect(readCustomerToken(token)).toBe("ada@example.com");
    expect(readCustomerToken("nope")).toBeNull();
  });

  it("limits OTP sends to five an hour and rejects a wrong code", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    await createRide({ selectedVehicle: new mongoose.Types.ObjectId(), email: "ada@example.com" });
    for (let send = 0; send < 5; send += 1) {
      expect((await sendCustomerOtp("ada@example.com")).ok).toBe(true);
    }
    expect((await sendCustomerOtp("ada@example.com")).ok).toBe(false);
    const wrong = await verifyCustomerOtp("ada@example.com", "000000");
    expect(wrong.ok).toBe(false);
  });

  it("blocks a change inside the cutoff", async () => {
    await PricingRule.create({ customerCutoffHours: 4 });
    const soon = new Date(Date.now() + 60 * 60 * 1000);
    const date = soon.toISOString().slice(0, 10);
    const time = soon.toISOString().slice(11, 16);
    expect(await changeAllowed({ date, time })).toBe(false);
    const later = new Date(Date.now() + 48 * 60 * 60 * 1000);
    expect(await changeAllowed({ date: later.toISOString().slice(0, 10), time: "12:00" })).toBe(true);
  });
});
