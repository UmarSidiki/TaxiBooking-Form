import { beforeEach, describe, expect, it, vi } from "vitest";

import { connectDB } from "@/shared/db";
import CustomerStats from "@/features/customers-admin/model/CustomerStats";
import Setting from "@/features/settings/model/Setting";
import {
  campaignTemplateWriteSchema,
  extractTemplateVariables,
  hasWhatsAppOptOutLine,
} from "@/features/marketing/schema/campaign-template.schema";
import { segmentFilterSchema } from "@/features/marketing/schema/segment.schema";
import { createSegment } from "@/features/marketing/lib/segments/segment.repo";
import { createCampaignTemplate } from "@/features/marketing/lib/templates/campaign-template.repo";
import { renderCampaignTemplate } from "@/features/marketing/lib/templates/render-template";
import { buildTemplateVariables } from "@/features/marketing/lib/templates/template-variables";
import { previewCampaignTemplate } from "@/features/marketing/lib/templates/preview-campaign-template";

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

const EMAIL_BODY = "<p>Hi {{firstName}}</p><a href=\"{{unsubscribeUrl}}\">Unsubscribe</a>";

beforeEach(() => {
  process.env.NEXTAUTH_SECRET = "test-secret";
  auth.role = "admin";
});

function emailTemplate(overrides: Record<string, unknown> = {}) {
  return {
    channel: "email" as const,
    name: "Weekend rides",
    locales: {
      en: {
        subject: "Ride with {{firstName}}",
        preheader: "A seat is waiting",
        body: EMAIL_BODY,
      },
    },
    ...overrides,
  };
}

async function seedCustomer(input: {
  email: string;
  name?: string;
  emailConsent?: "none" | "granted";
  lastRideAt?: Date | null;
}) {
  await connectDB();
  await CustomerStats.create({
    emailLower: input.email,
    name: input.name ?? "Ada Lovelace",
    nameLower: (input.name ?? "Ada Lovelace").toLowerCase(),
    rideCount: 3,
    lastRideAt:
      input.lastRideAt === undefined
        ? new Date("2026-08-01T00:00:00Z")
        : input.lastRideAt,
    emailConsent: input.emailConsent ?? "granted",
    whatsappConsent: "none",
    locale: "en",
  });
}

describe("campaign template validation", () => {
  it("rejects email bodies without {{unsubscribeUrl}}", () => {
    const parsed = campaignTemplateWriteSchema.safeParse(
      emailTemplate({
        locales: {
          en: { subject: "Hi", preheader: "", body: "<p>No opt-out</p>" },
        },
      }),
    );
    expect(parsed.success).toBe(false);

    const missingLocale = campaignTemplateWriteSchema.safeParse(
      emailTemplate({
        locales: {
          fr: { subject: "Salut", preheader: "", body: EMAIL_BODY },
        },
      }),
    );
    expect(missingLocale.success).toBe(false);
  });

  it("requires the WhatsApp opt-out line and rejects unknown variables", () => {
    const withoutLine = campaignTemplateWriteSchema.safeParse({
      channel: "whatsapp",
      name: "Offers",
      locales: { en: { body: "Hi {{firstName}}, {{unsubscribeUrl}}" } },
    });
    expect(withoutLine.success).toBe(false);

    const withLine = campaignTemplateWriteSchema.safeParse({
      channel: "whatsapp",
      name: "Offers",
      locales: {
        en: { body: "Hi {{firstName}}. Reply STOP to unsubscribe" },
      },
    });
    expect(withLine.success).toBe(true);

    const unknown = campaignTemplateWriteSchema.safeParse(
      emailTemplate({
        locales: {
          en: {
            subject: "Hi",
            preheader: "",
            body: "{{unknownThing}} {{unsubscribeUrl}}",
          },
        },
      }),
    );
    expect(unknown.success).toBe(false);
  });

  it("exposes the variable and opt-out helpers", () => {
    expect(
      extractTemplateVariables("Hi {{firstName}} {{unsubscribeUrl}}"),
    ).toEqual(["firstName", "unsubscribeUrl"]);
    expect(hasWhatsAppOptOutLine("reply stop to unsubscribe")).toBe(true);
  });

  it("rejects invalid templates over the admin API", async () => {
    const { POST } = await import("@/app/api/admin/marketing/templates/route");
    const response = await POST(
      new Request("http://local/api/admin/marketing/templates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          channel: "email",
          name: "Bad",
          locales: { en: { subject: "Hi", body: "<p>No opt-out</p>" } },
        }),
      }),
    );
    expect(response.status).toBe(400);
  });
});

describe("template rendering", () => {
  it("HTML-escapes interpolated customer values", () => {
    const rendered = renderCampaignTemplate({
      channel: "email",
      locales: {
        en: {
          subject: "Hi {{firstName}}",
          preheader: "",
          body: '<p>{{firstName}}</p><a href="{{unsubscribeUrl}}">{{promoCode}}</a>',
        },
      },
      locale: "en",
      fallbackLocale: "en",
      values: buildTemplateVariables({
        customer: {
          name: '<script>alert("x")</script>',
          lastRideAt: null,
          rideCount: 1,
        },
        locale: "en",
        unsubscribeUrl: "https://rides.example.com/u/token?a=1&b=2",
      }),
    });

    expect(rendered).not.toBeNull();
    expect(rendered?.body).toContain("&lt;script&gt;");
    expect(rendered?.body).not.toContain("<script>");
    expect(rendered?.body).toContain("a=1&amp;b=2");
    expect(rendered?.missingVariables).toEqual(["promoCode"]);
  });

  it("falls back to the default locale", () => {
    const rendered = renderCampaignTemplate({
      channel: "email",
      locales: { en: { subject: "Hi", preheader: "", body: "Hello" } },
      locale: "fr",
      fallbackLocale: "en",
      values: buildTemplateVariables({ locale: "fr" }),
    });
    expect(rendered).toMatchObject({
      locale: "en",
      fallbackUsed: true,
      body: "Hello",
    });
  });
});

describe("template preview", () => {
  it("previews against a chosen segment customer and warns about missing variables", async () => {
    await Setting.create({ publicBaseUrl: "https://rides.example.com" });
    await seedCustomer({
      email: "ada@example.com",
      name: "<b>Ada</b>",
      lastRideAt: null,
    });
    const segment = await createSegment({
      name: "Email audience",
      filter: segmentFilterSchema.parse({}),
    });
    const template = await createCampaignTemplate(
      campaignTemplateWriteSchema.parse(
        emailTemplate({
          locales: {
            en: {
              subject: "Hi {{firstName}}",
              preheader: "",
              body: "<p>{{firstName}}</p><p>{{lastRideDate}}</p>{{unsubscribeUrl}}",
            },
          },
        }),
      ),
    );

    const result = await previewCampaignTemplate({
      templateId: template.id,
      segmentId: segment.id,
      email: "ada@example.com",
      locale: "en",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.preview.customer.email).toBe("ada@example.com");
    expect(result.preview.missingVariables).toContain("lastRideDate");
    expect(result.preview.body).toContain("https://rides.example.com/en/u/");
    expect(result.preview.body).toContain("&lt;b&gt;Ada&lt;/b&gt;");
    expect(result.preview.body).not.toContain("<b>Ada</b>");
  });

  it("refuses a customer that is not eligible in the segment", async () => {
    await seedCustomer({
      email: "not-consented@example.com",
      emailConsent: "none",
    });
    const segment = await createSegment({
      name: "Email audience",
      filter: segmentFilterSchema.parse({}),
    });
    const template = await createCampaignTemplate(
      campaignTemplateWriteSchema.parse(emailTemplate()),
    );

    const result = await previewCampaignTemplate({
      templateId: template.id,
      segmentId: segment.id,
      email: "not-consented@example.com",
      locale: "en",
    });
    expect(result).toEqual({ ok: false, error: "customer_not_in_segment" });
  });

  it("returns 403 for non-admin roles", async () => {
    auth.role = "driver";
    const { POST } = await import(
      "@/app/api/admin/marketing/templates/[id]/preview/route"
    );
    const response = await POST(
      new Request("http://local/api/admin/marketing/templates/x/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ segmentId: "y" }),
      }),
      { params: Promise.resolve({ id: "abc" }) },
    );
    expect(response.status).toBe(403);
  });
});
