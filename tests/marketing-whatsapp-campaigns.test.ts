import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resetTestDb } from "./helpers/db";
import CustomerProfile from "@/features/customers/model/CustomerProfile";
import CustomerStats from "@/features/customers-admin/model/CustomerStats";
import Setting from "@/features/settings/model/Setting";
import Campaign from "@/features/marketing/model/Campaign";
import CampaignRecipient from "@/features/marketing/model/CampaignRecipient";
import { createSegment } from "@/features/marketing/lib/segments/segment.repo";
import { createCampaignTemplate } from "@/features/marketing/lib/templates/campaign-template.repo";
import { campaignTemplateWriteSchema } from "@/features/marketing/schema/campaign-template.schema";
import { materialiseCampaignRecipients } from "@/features/marketing/lib/campaigns/materialise-recipients";
import { runCampaignTick } from "@/features/marketing/lib/campaigns/run-campaign-tick";
import { clearWhatsAppOutbox, readWhatsAppOutbox } from "@/features/settings/lib/whatsapp-outbox";
import { applyMarketingConsent } from "@/features/marketing/lib/consent/apply-marketing-consent";
import WhatsAppSendLog from "@/features/settings/model/WhatsAppSendLog";

const EMAIL = "ada@example.com";
const PHONE = "41791234567";

beforeEach(async () => {
  await resetTestDb();
  process.env.NEXTAUTH_SECRET = "test-secret";
  process.env.QA_MOCK_WHATSAPP = "1";
  await Setting.create({
    publicBaseUrl: "https://rides.example.com",
    timezone: "UTC",
    marketingWhatsappDailyCap: 100,
  });
  await CustomerProfile.create({
    email: EMAIL,
    name: "Ada Lovelace",
    verifiedPhone: PHONE,
    marketing: { email: { status: "none" }, whatsapp: { status: "granted" } },
  });
  await CustomerStats.create({
    emailLower: EMAIL,
    name: "Ada Lovelace",
    nameLower: "ada lovelace",
    phoneDigits: PHONE,
    verifiedPhone: PHONE,
    emailConsent: "none",
    whatsappConsent: "granted",
    locale: "en",
  });
  await applyMarketingConsent({
    email: EMAIL,
    channel: "whatsapp",
    status: "granted",
    source: "account",
  });
});

afterEach(() => {
  delete process.env.QA_MOCK_WHATSAPP;
  clearWhatsAppOutbox();
});

async function seedCampaign() {
  const segment = await createSegment({ name: "All", filter: {} as never });
  const template = await createCampaignTemplate(
    campaignTemplateWriteSchema.parse({
      channel: "whatsapp",
      name: "WA",
      locales: {
        en: { body: "Hi {{firstName}}, reply STOP to unsubscribe" },
      },
    }),
  );
  const campaign = await Campaign.create({
    name: "WA campaign",
    channel: "whatsapp",
    segmentId: segment.id,
    templateId: template.id,
    templateVersion: template.version,
    status: "scheduled",
    scheduledAt: null,
    throttle: { perRun: 10, dailyCap: 0 },
    quietHours: { startHour: 20, endHour: 9, timeZone: "UTC" },
    stats: {},
    createdBy: "admin-1",
  });
  await materialiseCampaignRecipients(String(campaign._id));
  return { segment, template, campaign };
}

describe("marketing whatsapp campaigns", () => {
  it("sends once and does not double-send on rerun", async () => {
    const { campaign } = await seedCampaign();
    const first = await runCampaignTick({
      now: new Date("2026-01-15T12:00:00Z"),
      deadlineMs: new Date("2026-01-15T12:00:00Z").getTime() + 50_000,
    });
    expect(first.locked).toBe(true);
    expect(readWhatsAppOutbox()).toHaveLength(1);

    await runCampaignTick({
      now: new Date("2026-01-15T12:00:00Z"),
      deadlineMs: new Date("2026-01-15T12:00:00Z").getTime() + 50_000,
    });
    expect(readWhatsAppOutbox()).toHaveLength(1);
    const recipients = await CampaignRecipient.find({
      campaignId: campaign._id,
    }).lean();
    expect(recipients[0].status).toBe("sent");
  });

  it("skips recipients without whatsapp consent", async () => {
    await applyMarketingConsent({
      email: EMAIL,
      channel: "whatsapp",
      status: "withdrawn",
      source: "unsubscribe_link",
    });
    await seedCampaign();
    await runCampaignTick({
      now: new Date("2026-01-15T12:00:00Z"),
      deadlineMs: new Date("2026-01-15T12:00:00Z").getTime() + 50_000,
    });
    expect(readWhatsAppOutbox()).toHaveLength(0);
  });

  it("respects quiet hours", async () => {
    await seedCampaign();
    await runCampaignTick({
      now: new Date("2026-01-15T21:00:00Z"),
      deadlineMs: new Date("2026-01-15T21:00:00Z").getTime() + 50_000,
    });
    expect(readWhatsAppOutbox()).toHaveLength(0);
  });

  it("respects marketing daily cap", async () => {
    await WhatsAppSendLog.create({
      idempotencyKey: "campaign:old:ada",
      jid: PHONE + "@s.whatsapp.net",
      kind: "campaign",
      status: "sent",
      attempts: 1,
    });
    await Setting.updateOne({}, { $set: { marketingWhatsappDailyCap: 1 } });
    await seedCampaign();
    await runCampaignTick({
      now: new Date("2026-01-15T12:00:00Z"),
      deadlineMs: new Date("2026-01-15T12:00:00Z").getTime() + 50_000,
    });
    expect(readWhatsAppOutbox()).toHaveLength(0);
  });

  it("limits 20 per tick", async () => {
    // add 25 customers
    for (let i = 0; i < 25; i++) {
      const e = `u${i}@example.com`;
      const phone = `417900000${String(i).padStart(2, "0")}`;
      await CustomerProfile.create({
        email: e,
        name: `User ${i}`,
        verifiedPhone: phone,
        marketing: { whatsapp: { status: "granted" } },
      });
      await CustomerStats.create({
        emailLower: e,
        name: `User ${i}`,
        nameLower: `user ${i}`,
        phoneDigits: phone,
        verifiedPhone: phone,
        whatsappConsent: "granted",
        locale: "en",
      });
      await applyMarketingConsent({
        email: e,
        channel: "whatsapp",
        status: "granted",
        source: "account",
      });
    }
    await seedCampaign();
    await runCampaignTick({
      now: new Date("2026-01-15T12:00:00Z"),
      deadlineMs: new Date("2026-01-15T12:00:00Z").getTime() + 50_000,
    });
    expect(readWhatsAppOutbox()).toHaveLength(20);
  });

  it("auto-pauses on high failure rate", async () => {
    // Use real socket mock via vi.mock? Instead simulate by monkeypatching sendWhatsApp in options.
    // We'll pass a sendWhatsApp that returns all failed.
    const { campaign } = await seedCampaign();
    await runCampaignTick({
      now: new Date("2026-01-15T12:00:00Z"),
      deadlineMs: new Date("2026-01-15T12:00:00Z").getTime() + 50_000,
      sendWhatsApp: (async () => ({
        ok: true as const,
        results: [{ jid: PHONE + "@s.whatsapp.net", ok: false, error: "send_failed" }],
      })) as never,
    });
    const updated = await Campaign.findById(campaign._id).lean();
    expect(updated?.status).toBe("paused");
  });

  it("uses idempotency key campaign:{id}:{email}", async () => {
    // QA mock doesn't write log; check recipient idempotencyKey instead
    const { campaign } = await seedCampaign();
    await runCampaignTick({
      now: new Date("2026-01-15T12:00:00Z"),
      deadlineMs: new Date("2026-01-15T12:00:00Z").getTime() + 50_000,
    });
    const recipient = await CampaignRecipient.findOne({
      campaignId: campaign._id,
    }).lean();
    expect(recipient?.idempotencyKey).toBe(
      `campaign:${String(campaign._id)}:${EMAIL}`,
    );
  });
});
