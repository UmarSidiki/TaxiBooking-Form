import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { connectDB } from "@/shared/db";
import CustomerProfile from "@/features/customers/model/CustomerProfile";
import CustomerStats from "@/features/customers-admin/model/CustomerStats";
import AdminAuditLog from "@/features/customers-admin/model/AdminAuditLog";
import MarketingConsent from "@/features/marketing/model/MarketingConsent";
import Suppression from "@/features/marketing/model/Suppression";
import Setting from "@/features/settings/model/Setting";
import { signCustomerToken, readCustomerToken } from "@/features/customers/lib/customer-token";
import { applyMarketingConsent } from "@/features/marketing/lib/consent/apply-marketing-consent";
import { checkMarketingEligibility } from "@/features/marketing/lib/eligibility/marketing-eligibility";
import { isMarketingQuietHours } from "@/features/marketing/lib/eligibility/quiet-hours";
import { recordCheckoutMarketingConsent } from "@/features/marketing/lib/checkout/record-checkout-consent";
import { MARKETING_CONSENT_TEXT_VERSION } from "@/features/marketing/lib/marketing.constants";
import { buildListUnsubscribeHeaders } from "@/features/marketing/lib/unsubscribe/list-unsubscribe-headers";
import {
  readUnsubscribeToken,
  signUnsubscribeToken,
} from "@/features/marketing/lib/unsubscribe/unsubscribe-token";
import { unsubscribeWithToken } from "@/features/marketing/lib/unsubscribe/unsubscribe.service";
import { sendMarketingEmail } from "@/features/marketing/lib/email/send-marketing-email";
import { clearQaMail, readQaMail } from "@/features/settings/lib/email-outbox";

const auth = vi.hoisted(() => ({
  role: "admin" as "admin" | "driver",
  email: "admin1@example.com",
  name: "Admin One",
  id: "admin-1",
}));

vi.mock("@/features/auth/lib/require-role", () => ({
  requireAdmin: async () => {
    if (auth.role !== "admin") {
      return {
        ok: false as const,
        response: new Response(
          JSON.stringify({ success: false, error: "forbidden" }),
          { status: 403 },
        ),
      };
    }
    return {
      ok: true as const,
      session: {
        user: {
          id: auth.id,
          role: auth.role,
          email: auth.email,
          name: auth.name,
        },
      },
    };
  },
}));

const EMAIL = "ada@example.com";
const PHONE = "41791234567";

beforeEach(() => {
  process.env.NEXTAUTH_SECRET = "test-secret";
  auth.role = "admin";
});

afterEach(() => {
  auth.role = "admin";
  delete process.env.QA_MOCK_EMAIL;
  clearQaMail();
});

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function seedProfile(input: {
  email?: string;
  verifiedPhone?: string;
  emailStatus?: "none" | "granted" | "withdrawn";
  whatsappStatus?: "none" | "granted" | "withdrawn";
} = {}) {
  await connectDB();
  const email = (input.email ?? EMAIL).toLowerCase();
  await CustomerProfile.create({
    email,
    name: "Ada Lovelace",
    verifiedPhone: input.verifiedPhone ?? PHONE,
    marketing: {
      email: { status: input.emailStatus ?? "none" },
      whatsapp: { status: input.whatsappStatus ?? "none" },
    },
  });
  await CustomerStats.create({
    emailLower: email,
    name: "Ada Lovelace",
    nameLower: "ada lovelace",
    phoneDigits: input.verifiedPhone ?? PHONE,
    verifiedPhone: input.verifiedPhone ?? PHONE,
    emailConsent: input.emailStatus ?? "none",
    whatsappConsent: input.whatsappStatus ?? "none",
  });
  return email;
}

describe("marketing consent", () => {
  it("keeps past customers unconsented until they book, then auto-grants both channels", async () => {
    const email = await seedProfile();

    const before = await checkMarketingEligibility({ email, channel: "email" });
    expect(before).toMatchObject({ eligible: false, reason: "no_consent", status: "none" });

    // A booking auto-grants both channels.
    await recordCheckoutMarketingConsent({ email, phone: PHONE });

    const events = await MarketingConsent.find({ emailLower: email }).lean();
    expect(events).toHaveLength(2);
    expect(events.map((event) => event.channel).sort()).toEqual(["email", "whatsapp"]);
    expect(events.every((event) => event.source === "checkout_auto")).toBe(true);
    expect(events.every((event) => event.textVersion === MARKETING_CONSENT_TEXT_VERSION)).toBe(
      true,
    );

    const profile = await CustomerProfile.findOne({ email }).lean<{
      marketing: { email: { status: string }; whatsapp: { status: string } };
    }>();
    expect(profile?.marketing.email.status).toBe("granted");
    expect(profile?.marketing.whatsapp.status).toBe("granted");

    const stats = await CustomerStats.findOne({ emailLower: email }).lean<{
      emailConsent: string;
      whatsappConsent: string;
    }>();
    expect(stats).toMatchObject({ emailConsent: "granted", whatsappConsent: "granted" });

    await expect(
      checkMarketingEligibility({ email, channel: "email" }),
    ).resolves.toMatchObject({ eligible: true, reason: "eligible" });
    await expect(
      checkMarketingEligibility({ email, channel: "whatsapp" }),
    ).resolves.toMatchObject({ eligible: true, reason: "eligible" });
  });

  it("never targets withdrawn or suppressed customers, and keeps hard bounces", async () => {
    const email = await seedProfile({ emailStatus: "granted" });

    await applyMarketingConsent({
      email,
      channel: "email",
      status: "withdrawn",
      source: "unsubscribe_link",
    });

    await expect(
      checkMarketingEligibility({ email, channel: "email" }),
    ).resolves.toMatchObject({ eligible: false, reason: "no_consent" });
    expect(
      await Suppression.exists({ channel: "email", key: email, reason: "unsubscribed" }),
    ).toBeTruthy();

    // A new opt-in clears an unsubscribe suppression.
    await applyMarketingConsent({
      email,
      channel: "email",
      status: "granted",
      source: "account",
    });
    await expect(
      checkMarketingEligibility({ email, channel: "email" }),
    ).resolves.toMatchObject({ eligible: true });

    // But never a bounce or complaint.
    await Suppression.create({ channel: "email", key: email, reason: "bounced" });
    await expect(
      checkMarketingEligibility({ email, channel: "email" }),
    ).resolves.toMatchObject({ eligible: false, reason: "suppressed" });

    await applyMarketingConsent({
      email,
      channel: "email",
      status: "granted",
      source: "account",
    });
    expect(
      await Suppression.exists({ channel: "email", key: email, reason: "bounced" }),
    ).toBeTruthy();
  });

  it("requires a verified number before WhatsApp becomes eligible", async () => {
    const email = await seedProfile({
      whatsappStatus: "granted",
      verifiedPhone: "",
    });

    await expect(
      checkMarketingEligibility({ email, channel: "whatsapp" }),
    ).resolves.toMatchObject({ eligible: false, reason: "unverified_phone" });
  });
});

describe("unsubscribe token", () => {
  it("rejects tokens signed for another purpose", () => {
    const otherPurpose = signCustomerToken(
      "ride_status",
      { l: "en", t: "not-an-unsubscribe-payload" },
      3600,
    );
    expect(otherPurpose).not.toBeNull();
    expect(readUnsubscribeToken(otherPurpose)).toBeNull();

    const unsubscribe = signUnsubscribeToken({
      email: EMAIL,
      channel: "email",
      locale: "en",
    });
    expect(unsubscribe).not.toBeNull();
    expect(readCustomerToken(unsubscribe, "ride_status")).toBeNull();
    expect(readUnsubscribeToken(unsubscribe)).toEqual({
      email: EMAIL,
      channel: "email",
      locale: "en",
    });
  });

  it("unsubscribes without login through a one-click POST and can re-subscribe", async () => {
    const email = await seedProfile({ emailStatus: "granted" });
    const token = signUnsubscribeToken({ email, channel: "email", locale: "fr" });
    if (!token) throw new Error("expected token");

    const { POST } = await import("@/app/api/marketing/unsubscribe/route");
    const response = await POST(
      new Request(
        `http://local/api/marketing/unsubscribe?token=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: "List-Unsubscribe=One-Click",
        },
      ),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      channel: "email",
      status: "withdrawn",
    });

    expect(
      await Suppression.exists({ channel: "email", key: email }),
    ).toBeTruthy();
    expect(
      (await MarketingConsent.findOne({ emailLower: email }).lean())?.source,
    ).toBe("unsubscribe_link");

    const resubscribe = await POST(
      new Request("http://local/api/marketing/unsubscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, action: "resubscribe" }),
      }),
    );
    expect(resubscribe.status).toBe(200);
    expect(await resubscribe.json()).toMatchObject({
      success: true,
      status: "granted",
    });
    expect(await Suppression.exists({ channel: "email", key: email })).toBeFalsy();
    await expect(
      checkMarketingEligibility({ email, channel: "email" }),
    ).resolves.toMatchObject({ eligible: true });
  });

  it("rejects a cross-purpose token at the public endpoint", async () => {
    const token = signCustomerToken(
      "ride_status",
      { l: "en", t: "payload" },
      3600,
    );
    const { POST } = await import("@/app/api/marketing/unsubscribe/route");
    const response = await POST(
      new Request(`http://local/api/marketing/unsubscribe?token=${token}`, {
        method: "POST",
      }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "invalid_token" });
  });
});

describe("admin consent actions", () => {
  it("allows only withdrawal or documented offline consent, audited", async () => {
    const email = await seedProfile();
    const { POST } = await import("@/app/api/admin/customers/[id]/marketing/route");

    const missingReason = await POST(
      new Request(`http://local/api/admin/customers/${email}/marketing`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          channel: "email",
          action: "record_offline",
          reason: "",
        }),
      }),
      params(email),
    );
    expect(missingReason.status).toBe(400);
    expect(await MarketingConsent.countDocuments({ emailLower: email })).toBe(0);

    const offline = await POST(
      new Request(`http://local/api/admin/customers/${email}/marketing`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          channel: "email",
          action: "record_offline",
          reason: "Signed form at the desk on 2026-10-30",
        }),
      }),
      params(email),
    );
    expect(offline.status).toBe(200);
    expect(await offline.json()).toMatchObject({
      success: true,
      data: { email: { status: "granted" } },
    });

    const withdraw = await POST(
      new Request(`http://local/api/admin/customers/${email}/marketing`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          channel: "email",
          action: "withdraw",
          reason: "Customer called",
        }),
      }),
      params(email),
    );
    expect(withdraw.status).toBe(200);
    expect(await withdraw.json()).toMatchObject({
      success: true,
      data: { email: { status: "withdrawn" } },
    });

    const audits = await AdminAuditLog.find({ targetId: email }).lean();
    expect(audits.map((entry) => entry.action).sort()).toEqual([
      "customer.consent.record_offline",
      "customer.consent.withdraw",
    ]);
    await expect(
      checkMarketingEligibility({ email, channel: "email" }),
    ).resolves.toMatchObject({ eligible: false, reason: "no_consent" });
  });

  it("returns 403 for non-admin roles", async () => {
    const email = await seedProfile();
    auth.role = "driver";
    const { POST } = await import("@/app/api/admin/customers/[id]/marketing/route");

    const response = await POST(
      new Request(`http://local/api/admin/customers/${email}/marketing`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ channel: "email", action: "withdraw" }),
      }),
      params(email),
    );
    expect(response.status).toBe(403);
    expect(await AdminAuditLog.countDocuments({ targetId: email })).toBe(0);
  });
});

describe("marketing mail", () => {
  it("adds one-click List-Unsubscribe headers and uses the marketing sender", async () => {
    process.env.QA_MOCK_EMAIL = "1";
    await Setting.create({
      smtpFrom: "bookings@example.com",
      smtpSenderName: "Bookings",
      marketingSenderEmail: "offers@example.com",
      marketingSenderName: "Offers",
      marketingReplyTo: "reply@example.com",
    });
    const token = signUnsubscribeToken({
      email: EMAIL,
      channel: "email",
      locale: "en",
    });
    if (!token) throw new Error("expected token");

    const sent = await sendMarketingEmail({
      to: EMAIL,
      subject: "Weekend rides",
      html: "<p>Hello</p>",
      unsubscribeToken: token,
      locale: "en",
      baseUrl: "https://rides.example.com",
    });
    expect(sent).toBe(true);

    const mail = readQaMail()[0];
    const headers = mail.headers as Record<string, string> | undefined;
    expect(mail.to).toBe(EMAIL);
    expect(mail.from).toEqual({ name: "Offers", address: "offers@example.com" });
    expect(mail.replyTo).toBe("reply@example.com");
    expect(headers?.["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    expect(headers?.["List-Unsubscribe"]).toBe(
      `<https://rides.example.com/api/marketing/unsubscribe?token=${encodeURIComponent(token)}>`,
    );
  });

  it("builds the documented headers with a trimmed base URL", () => {
    const headers = buildListUnsubscribeHeaders({
      baseUrl: "https://rides.example.com/",
      token: "abc",
      locale: "de",
    });
    expect(headers).toEqual({
      "List-Unsubscribe": "<https://rides.example.com/api/marketing/unsubscribe?token=abc>",
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    });
  });

  it("defaults quiet hours to 20:00–09:00 operator time", () => {
    expect(isMarketingQuietHours(new Date("2026-01-15T20:30:00Z"), "Europe/Zurich")).toBe(
      true,
    );
    expect(isMarketingQuietHours(new Date("2026-01-15T11:00:00Z"), "Europe/Zurich")).toBe(
      false,
    );
  });
});

describe("unsubscribe service", () => {
  it("rejects an invalid token without touching the database", async () => {
    await expect(unsubscribeWithToken("not-a-token")).resolves.toEqual({
      ok: false,
      error: "invalid_token",
    });
  });
});

describe("checkout auto opt-in", () => {
  it("records nothing while the Marketing module is off, and grants once on", async () => {
    const email = "module-off@example.com";
    await Setting.updateOne({}, { $set: { enableMarketing: false } }, { upsert: true });
    await recordCheckoutMarketingConsent({ email, phone: "41791234567" });
    expect(await MarketingConsent.countDocuments({ emailLower: email })).toBe(0);
    expect(await CustomerProfile.countDocuments({ email })).toBe(0);

    await Setting.updateOne({}, { $set: { enableMarketing: true } });
    await recordCheckoutMarketingConsent({ email, phone: "41791234567" });
    expect(await MarketingConsent.countDocuments({ emailLower: email, status: "granted" })).toBe(2);
  });

  it("never re-subscribes a customer who opted out or unsubscribed", async () => {
    const email = "optedout@example.com";
    await applyMarketingConsent({ email, channel: "email", status: "granted", source: "account" });
    await applyMarketingConsent({ email, channel: "email", status: "withdrawn", source: "unsubscribe_link" });
    await applyMarketingConsent({
      email,
      channel: "whatsapp",
      status: "withdrawn",
      source: "whatsapp_stop",
      phoneDigits: "41790000001",
    });
    // Cache cleared by hand: the withdrawn event and suppression still protect them.
    await CustomerProfile.updateOne({ email }, { $set: { "marketing.email.status": "none", "marketing.whatsapp.status": "none" } });

    await recordCheckoutMarketingConsent({ email, phone: "+41 79 000 00 01" });

    expect(await MarketingConsent.countDocuments({ emailLower: email, source: "checkout_auto" })).toBe(0);
    expect(await Suppression.countDocuments({ channel: "email", key: email })).toBe(1);
    expect(await Suppression.countDocuments({ channel: "whatsapp", key: "41790000001" })).toBe(1);
  });

  it("does not add a second grant for an already subscribed customer", async () => {
    const email = "already@example.com";
    await applyMarketingConsent({ email, channel: "email", status: "granted", source: "account" });
    await recordCheckoutMarketingConsent({ email });
    expect(await MarketingConsent.countDocuments({ emailLower: email, channel: "email" })).toBe(1);
    expect(await MarketingConsent.countDocuments({ emailLower: email, channel: "whatsapp" })).toBe(1);
  });
});
