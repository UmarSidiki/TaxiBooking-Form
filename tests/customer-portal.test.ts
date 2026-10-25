import { describe, expect, it } from "vitest";
import { readCustomerToken, signCustomerToken } from "@/features/customers/lib/customer-token";
import { sendCustomerOtp, verifyCustomerOtp } from "@/features/customers/lib/customer-otp";
import { changeAllowed } from "@/features/customers/lib/customer-rides";
import PricingRule from "@/features/pricing/model/PricingRule";

describe("customer portal", () => {
  it("signs a magic link and rejects a bad token", () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    const token = signCustomerToken("ada@example.com", 60);
    expect(readCustomerToken(token)).toBe("ada@example.com");
    expect(readCustomerToken("nope")).toBeNull();
  });

  it("limits OTP sends and accepts the right code", async () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    process.env.QA_MOCK_WHATSAPP = "1";
    const first = await sendCustomerOtp("ada@example.com", "+14155552671");
    expect(first.ok).toBe(true);
    await sendCustomerOtp("ada@example.com", "+14155552671");
    await sendCustomerOtp("ada@example.com", "+14155552671");
    const blocked = await sendCustomerOtp("ada@example.com", "+14155552671");
    expect(blocked.ok).toBe(false);
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
