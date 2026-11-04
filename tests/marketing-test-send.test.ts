import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Setting from "@/features/settings/model/Setting";
import { campaignTemplateWriteSchema } from "@/features/marketing/schema/campaign-template.schema";
import { createCampaignTemplate } from "@/features/marketing/lib/templates/campaign-template.repo";
import { sendTestMessage } from "@/features/marketing/lib/test-send/send-test-message";
import {
  isAllowedTestRecipient,
  normaliseRecipient,
  parseTestRecipients,
} from "@/features/marketing/lib/test-send/staff-allowlist";
import { clearQaMail, readQaMail } from "@/features/settings/lib/email-outbox";
import {
  clearWhatsAppOutbox,
  readWhatsAppOutbox,
} from "@/features/settings/lib/whatsapp-outbox";

const auth = vi.hoisted(() => ({ role: "admin" as "admin" | "driver" }));

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
        user: { id: "admin-1", role: auth.role, email: "admin@example.com" },
      },
    };
  },
}));

const EMAIL_TEMPLATE = {
  channel: "email" as const,
  name: "Welcome",
  locales: {
    en: {
      subject: "Hi {{firstName}}",
      preheader: "",
      body: "<p>Hello {{firstName}}</p>{{unsubscribeUrl}}",
    },
  },
};

const WHATSAPP_TEMPLATE = {
  channel: "whatsapp" as const,
  name: "WhatsApp welcome",
  locales: {
    en: { body: "Hi {{firstName}}. Reply STOP to unsubscribe" },
  },
};

beforeEach(() => {
  process.env.NEXTAUTH_SECRET = "test-secret";
  auth.role = "admin";
});

afterEach(() => {
  delete process.env.QA_MOCK_EMAIL;
  delete process.env.QA_MOCK_WHATSAPP;
  clearQaMail();
  clearWhatsAppOutbox();
});

async function seedSettings() {
  await Setting.create({
    smtpFrom: "bookings@example.com",
    smtpSenderName: "Bookings",
    marketingSenderEmail: "offers@example.com",
    marketingSenderName: "Offers",
    marketingReplyTo: "reply@example.com",
    publicBaseUrl: "https://rides.example.com",
    marketingTestRecipients: ["staff@example.com", "+41 79 123 45 67"],
  });
}

describe("staff test allowlist", () => {
  it("normalises emails and phone numbers", () => {
    expect(normaliseRecipient(" Staff@Example.com ")).toEqual({
      kind: "email",
      key: "staff@example.com",
    });
    expect(normaliseRecipient("+41 (79) 123-45-67")).toEqual({
      kind: "phone",
      key: "41791234567",
    });
    expect(parseTestRecipients(["a@b.co", "+41 79 123", "a@b.co"])).toHaveLength(2);
    expect(
      isAllowedTestRecipient("STAFF@example.com", ["staff@example.com"]),
    ).toEqual({ kind: "email", key: "staff@example.com" });
    expect(
      isAllowedTestRecipient("intruder@example.com", ["staff@example.com"]),
    ).toBeNull();
  });
});

describe("staff-only test send", () => {
  it("refuses any recipient outside Settings → Marketing", async () => {
    process.env.QA_MOCK_EMAIL = "1";
    await seedSettings();
    const template = await createCampaignTemplate(
      campaignTemplateWriteSchema.parse(EMAIL_TEMPLATE),
    );

    const result = await sendTestMessage({
      templateId: template.id,
      recipient: "intruder@example.com",
      locale: "en",
    });
    expect(result).toEqual({
      ok: false,
      error: "recipient_not_allowlisted",
    });
    expect(readQaMail()).toHaveLength(0);
  });

  it("sends an email test through the marketing sender and never stores stats", async () => {
    process.env.QA_MOCK_EMAIL = "1";
    await seedSettings();
    const template = await createCampaignTemplate(
      campaignTemplateWriteSchema.parse(EMAIL_TEMPLATE),
    );

    const result = await sendTestMessage({
      templateId: template.id,
      recipient: "Staff@Example.com",
      locale: "en",
    });
    expect(result).toMatchObject({
      ok: true,
      channel: "email",
      recipient: "staff@example.com",
      sent: true,
    });

    const mail = readQaMail();
    expect(mail).toHaveLength(1);
    expect(mail[0].to).toBe("staff@example.com");
    expect(mail[0].from).toEqual({
      name: "Offers",
      address: "offers@example.com",
    });
    expect(mail[0].subject).toBe("Hi Test");
  });

  it("sends a WhatsApp test only to an allowlisted phone", async () => {
    process.env.QA_MOCK_WHATSAPP = "1";
    await seedSettings();
    const template = await createCampaignTemplate(
      campaignTemplateWriteSchema.parse(WHATSAPP_TEMPLATE),
    );

    const result = await sendTestMessage({
      templateId: template.id,
      recipient: "+41 79 123 45 67",
      locale: "en",
    });
    expect(result).toMatchObject({
      ok: true,
      channel: "whatsapp",
      recipient: "41791234567",
      sent: true,
    });

    const outbox = readWhatsAppOutbox();
    expect(outbox).toHaveLength(1);
    expect(outbox[0].jid).toBe("41791234567");
    expect(outbox[0].text).toContain("Reply STOP to unsubscribe");
  });

  it("rejects an emailed recipient for a WhatsApp template", async () => {
    await seedSettings();
    const template = await createCampaignTemplate(
      campaignTemplateWriteSchema.parse(WHATSAPP_TEMPLATE),
    );
    const result = await sendTestMessage({
      templateId: template.id,
      recipient: "staff@example.com",
      locale: "en",
    });
    expect(result).toEqual({
      ok: false,
      error: "recipient_channel_mismatch",
    });
  });

  it("returns 403 for non-admin roles at the API", async () => {
    auth.role = "driver";
    const { POST } = await import(
      "@/app/api/admin/marketing/templates/[id]/test-send/route"
    );
    const response = await POST(
      new Request("http://local/api/admin/marketing/templates/x/test-send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recipient: "staff@example.com" }),
      }),
      { params: Promise.resolve({ id: "abc" }) },
    );
    expect(response.status).toBe(403);
  });
});
