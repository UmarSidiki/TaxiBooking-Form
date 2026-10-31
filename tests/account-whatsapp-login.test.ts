import { beforeEach, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import CustomerOtp from "@/features/customers/model/CustomerOtp";
import CustomerProfile from "@/features/customers/model/CustomerProfile";
import CustomerSession from "@/features/customers/model/CustomerSession";
import {
  clearWhatsAppOutbox,
  readWhatsAppOutbox,
} from "@/features/settings/lib/whatsapp-outbox";
import { createRide } from "./helpers/fixtures";

const PHONE = "+14155552671";
const DIGITS = "14155552671";

let ipSeq = 0;
function request(path: string, body: unknown) {
  ipSeq += 1;
  return new Request(`http://local${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `198.51.100.${ipSeq}` },
    body: JSON.stringify(body),
  });
}

function lastMessage() {
  return readWhatsAppOutbox().at(-1);
}

async function waitForMessage() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const message = lastMessage();
    if (message) return message;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error("WhatsApp message never reached the mock outbox");
}

function codeFrom(message: { text?: string } | undefined) {
  return message?.text?.match(/\b\d{6}\b/)?.[0] ?? "";
}

async function verifiedProfile(email = "wa@example.com", phone = DIGITS) {
  return CustomerProfile.create({ email, verifiedPhone: phone });
}

async function sentCode(): Promise<string> {
  const { sendWhatsAppLoginOtp } = await import(
    "@/features/customers/lib/whatsapp-login-otp"
  );
  const result = await sendWhatsAppLoginOtp(PHONE);
  if (!result.ok || !("delivery" in result)) throw new Error("send failed");
  await result.delivery();
  return codeFrom(lastMessage());
}

beforeEach(() => {
  process.env.NEXTAUTH_SECRET = "test-secret";
  process.env.QA_MOCK_WHATSAPP = "1";
  clearWhatsAppOutbox();
});

describe("WhatsApp account login", () => {
  it("sends a code to the verified phone and signs in without exposing the email", async () => {
    await verifiedProfile();
    const { POST } = await import("@/app/api/account/otp/whatsapp/route");

    const response = await POST(
      request("/api/account/otp/whatsapp", { phone: PHONE }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    const message = await waitForMessage();
    expect(message.jid).toBe(`${DIGITS}@s.whatsapp.net`);
    const code = codeFrom(message);
    expect(code).toMatch(/^\d{6}$/);
    expect(readWhatsAppOutbox()).toHaveLength(1);

    const { POST: verify } = await import(
      "@/app/api/account/otp/whatsapp/verify/route"
    );
    const verified = await verify(
      request("/api/account/otp/whatsapp/verify", { phone: PHONE, code }),
    );
    expect(verified.status).toBe(200);
    const body = await verified.json();
    expect(body).toEqual({ ok: true });
    expect(JSON.stringify(body)).not.toContain("@");
    expect(verified.headers.get("set-cookie")).toContain("cs=");
    expect(
      await CustomerSession.countDocuments({ emailLower: "wa@example.com" }),
    ).toBe(1);
  });

  it("does not sign in with a phone that only exists on a booking", async () => {
    await createRide({
      selectedVehicle: new mongoose.Types.ObjectId(),
      email: "booker@example.com",
      phone: PHONE,
    });
    const { POST } = await import("@/app/api/account/otp/whatsapp/route");

    const response = await POST(
      request("/api/account/otp/whatsapp", { phone: PHONE }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: false,
      code: "whatsapp_not_verified",
    });
    expect(readWhatsAppOutbox()).toHaveLength(0);
    expect(await CustomerOtp.countDocuments({})).toBe(0);
  });

  it("does not sign in with an unverified profile phone", async () => {
    await CustomerProfile.create({
      email: "unverified@example.com",
      phone: PHONE,
      verifiedPhone: "",
    });
    const { POST } = await import("@/app/api/account/otp/whatsapp/route");

    const response = await POST(
      request("/api/account/otp/whatsapp", { phone: PHONE }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: false,
      code: "whatsapp_not_verified",
    });
    expect(readWhatsAppOutbox()).toHaveLength(0);
    expect(await CustomerOtp.countDocuments({})).toBe(0);
  });

  it("treats a duplicate verified phone as not found", async () => {
    await verifiedProfile("first@example.com");
    await verifiedProfile("second@example.com");
    const { POST } = await import("@/app/api/account/otp/whatsapp/route");

    const response = await POST(
      request("/api/account/otp/whatsapp", { phone: PHONE }),
    );
    expect(await response.json()).toEqual({
      ok: false,
      code: "whatsapp_not_verified",
    });
    expect(readWhatsAppOutbox()).toHaveLength(0);
    expect(await CustomerOtp.countDocuments({ codeHash: { $type: "string" } })).toBe(0);
  });

  it("rejects a body that carries an email", async () => {
    await verifiedProfile();
    const { POST } = await import("@/app/api/account/otp/whatsapp/route");

    const response = await POST(
      request("/api/account/otp/whatsapp", {
        phone: PHONE,
        email: "wa@example.com",
      }),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("invalid_body");
    expect(await CustomerOtp.countDocuments({})).toBe(0);
    expect(readWhatsAppOutbox()).toHaveLength(0);
  });

  it("blocks the sixth wrong guess", async () => {
    await verifiedProfile();
    const right = await sentCode();
    const wrong = right === "000000" ? "111111" : "000000";
    const { verifyWhatsAppLoginOtp } = await import(
      "@/features/customers/lib/whatsapp-login-otp"
    );

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const result = await verifyWhatsAppLoginOtp(PHONE, wrong);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toBe("invalid_code");
    }

    const blocked = await verifyWhatsAppLoginOtp(PHONE, wrong);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error).toBe("rate_limited");
  });

  it("caps ten concurrent wrong guesses at five attempts", async () => {
    await verifiedProfile();
    const right = await sentCode();
    const wrong = right === "000000" ? "111111" : "000000";
    const { verifyWhatsAppLoginOtp } = await import(
      "@/features/customers/lib/whatsapp-login-otp"
    );

    const results = await Promise.all(
      Array.from({ length: 10 }, () => verifyWhatsAppLoginOtp(PHONE, wrong)),
    );
    expect(results.every((result) => !result.ok)).toBe(true);

    const row = await CustomerOtp.findOne({ email: "wa@example.com" })
      .sort({ sentAt: -1 })
      .lean<{ attempts?: number }>();
    expect(row?.attempts).toBe(5);
  });

  it("rate limits the sixth send for the same phone", async () => {
    await verifiedProfile();
    for (let round = 0; round < 5; round += 1) {
      await sentCode();
    }

    const { POST } = await import("@/app/api/account/otp/whatsapp/route");
    const blocked = await POST(
      request("/api/account/otp/whatsapp", { phone: PHONE }),
    );
    expect(blocked.status).toBe(429);
    expect((await blocked.json()).error).toBe("rate_limited");
    expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0);
  });

  it("resolves the profile again at verification time", async () => {
    await verifiedProfile();
    const code = await sentCode();
    await CustomerProfile.updateOne(
      { email: "wa@example.com" },
      { $set: { verifiedPhone: "" } },
    );

    const { verifyWhatsAppLoginOtp } = await import(
      "@/features/customers/lib/whatsapp-login-otp"
    );
    const verified = await verifyWhatsAppLoginOtp(PHONE, code);
    expect(verified.ok).toBe(false);
    if (!verified.ok) expect(verified.error).toBe("invalid_code");
    expect(await CustomerSession.countDocuments({})).toBe(0);
  });

  it("pads an unknown number to the same send clock", async () => {
    const { POST } = await import("@/app/api/account/otp/whatsapp/route");
    const startedAt = Date.now();
    const response = await POST(
      request("/api/account/otp/whatsapp", { phone: "+14155559999" }),
    );
    const elapsed = Date.now() - startedAt;

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: false,
      code: "whatsapp_not_verified",
    });
    expect(elapsed).toBeGreaterThanOrEqual(700);
    expect(readWhatsAppOutbox()).toHaveLength(0);
  });
});
