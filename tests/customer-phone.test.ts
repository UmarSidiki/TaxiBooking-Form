import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import { signCustomerToken } from "@/features/customers/lib/customer-token";
import { sendCustomerOtp } from "@/features/customers/lib/customer-otp";
import CustomerProfile from "@/features/customers/model/CustomerProfile";
import { clearWhatsAppOutbox, readWhatsAppOutbox } from "@/features/settings/lib/whatsapp-outbox";
import { createRide } from "./helpers/fixtures";

const mocks = vi.hoisted(() => ({
  token: null as string | null,
  notify: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () =>
    new Map(mocks.token ? [["customer_session", { name: "customer_session", value: mocks.token }]] : []),
}));

vi.mock("@/features/notifications/notify", () => ({ notify: mocks.notify }));

afterAll(() => {
  vi.doUnmock("next/headers");
  vi.doUnmock("@/features/notifications/notify");
  vi.resetModules();
});

let ipSeq = 0;
function request(body?: unknown, method = "POST") {
  ipSeq += 1;
  return new Request("http://local/api/account/phone", {
    method,
    headers: { "content-type": "application/json", "x-forwarded-for": `198.51.100.${ipSeq}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function lastCode() {
  const text = readWhatsAppOutbox().at(-1)?.text ?? "";
  return /(\d{6})/.exec(text)?.[1] ?? "";
}

beforeEach(() => {
  process.env.NEXTAUTH_SECRET = "test-secret";
  process.env.QA_MOCK_WHATSAPP = "1";
  mocks.token = null;
  mocks.notify.mockReset();
  mocks.notify.mockImplementation(async (_event: string, ctx: { channels?: readonly string[] }) => ({
    ok: true,
    queued: 0,
    skipped: null,
    deliveries: (ctx.channels ?? []).map((channel) => ({ channel, audience: "customer", to: "someone" })),
  }));
  clearWhatsAppOutbox();
});

describe("verified WhatsApp number", () => {
  it("returns 401 without a session", async () => {
    const { POST, DELETE } = await import("@/app/api/account/phone/route");
    expect((await POST(request({ phone: "+14155552671" }))).status).toBe(401);
    expect((await DELETE(request(undefined, "DELETE"))).status).toBe(401);
  });

  it("does not verify with a wrong code", async () => {
    mocks.token = signCustomerToken("ada@example.com");
    const { POST } = await import("@/app/api/account/phone/route");
    expect((await POST(request({ phone: "+14155552671" }))).status).toBe(200);
    const wrong = lastCode() === "000000" ? "111111" : "000000";
    const response = await POST(request({ code: wrong }));
    expect(response.status).toBe(400);
    const profile = await CustomerProfile.findOne({ email: "ada@example.com" }).lean();
    expect(profile?.verifiedPhone ?? "").toBe("");
  });

  it("sets verifiedPhone with the right code", async () => {
    mocks.token = signCustomerToken("ada@example.com");
    const { POST } = await import("@/app/api/account/phone/route");
    expect((await POST(request({ phone: "+14155552671" }))).status).toBe(200);
    const response = await POST(request({ code: lastCode() }));
    expect(response.status).toBe(200);
    expect((await response.json()).phone).toBe("14155552671");
    const profile = await CustomerProfile.findOne({ email: "ada@example.com" }).lean();
    expect(profile?.verifiedPhone).toBe("14155552671");
  });

  it("delivers the whatsapp OTP channel to the verified phone", async () => {
    await createRide({ selectedVehicle: new mongoose.Types.ObjectId(), email: "ada@example.com" });
    await CustomerProfile.create({ email: "ada@example.com", verifiedPhone: "14155552671" });
    await sendCustomerOtp("ada@example.com", "whatsapp");
    expect(readWhatsAppOutbox().at(-1)?.jid).toBe("14155552671@s.whatsapp.net");
    expect(mocks.notify).not.toHaveBeenCalled();
  });
});
