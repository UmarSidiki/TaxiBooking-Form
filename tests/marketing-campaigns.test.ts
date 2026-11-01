import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resetTestDb } from "./helpers/db";
import CustomerProfile from "@/features/customers/model/CustomerProfile";
import CustomerStats from "@/features/customers-admin/model/CustomerStats";
import Setting from "@/features/settings/model/Setting";
import Campaign from "@/features/marketing/model/Campaign";
import CampaignRecipient from "@/features/marketing/model/CampaignRecipient";
import { createSegment } from "@/features/marketing/lib/segments/segment.repo";
import { createCampaignTemplate } from "@/features/marketing/lib/templates/campaign-template.repo";
import { materialiseCampaignRecipients } from "@/features/marketing/lib/campaigns/materialise-recipients";
import { runCampaignTick } from "@/features/marketing/lib/campaigns/run-campaign-tick";
import { clearQaMail, readQaMail } from "@/features/settings/lib/email-outbox";
import { applyMarketingConsent } from "@/features/marketing/lib/consent/apply-marketing-consent";

const EMAIL = "ada@example.com";

beforeEach(async () => {
  await resetTestDb();
  process.env.NEXTAUTH_SECRET = "test-secret";
  process.env.QA_MOCK_EMAIL = "1";
  await Setting.create({
    smtpFrom: "bookings@example.com",
    smtpSenderName: "Bookings",
    marketingSenderEmail: "offers@example.com",
    marketingSenderName: "Offers",
    marketingReplyTo: "reply@example.com",
    publicBaseUrl: "https://rides.example.com",
  });
  await CustomerProfile.create({
    email: EMAIL,
    name: "Ada Lovelace",
    verifiedPhone: "41791234567",
    marketing: { email: { status: "granted" }, whatsapp: { status: "none" } },
  });
  await CustomerStats.create({
    emailLower: EMAIL,
    name: "Ada Lovelace",
    nameLower: "ada lovelace",
    phoneDigits: "41791234567",
    verifiedPhone: "41791234567",
    emailConsent: "granted",
    whatsappConsent: "none",
    locale: "en",
  });
});

afterEach(() => {
  delete process.env.QA_MOCK_EMAIL;
  clearQaMail();
});

async function seedCampaign() {
  const segment = await createSegment({ name: "All", filter: {} as never });
  const template = await createCampaignTemplate({
    channel: "email",
    name: "Welcome",
    locales: {
      en: {
        subject: "Hi {{firstName}}",
        preheader: "",
        body: "<p>Hello {{firstName}}</p>{{unsubscribeUrl}}",
      },
    },
  } as never);
  const campaign = await Campaign.create({
    name: "Test campaign",
    channel: "email",
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

describe("marketing campaigns", () => {
  it("sends once and does not double-send on rerun", async () => {
    const { campaign } = await seedCampaign();
    const first = await runCampaignTick({ now: new Date(), deadlineMs: Date.now() + 50_000 });
    expect(first.locked).toBe(true);
    expect(readQaMail()).toHaveLength(1);

    const second = await runCampaignTick({ now: new Date(), deadlineMs: Date.now() + 50_000 });
    expect(second.locked).toBe(true);
    expect(readQaMail()).toHaveLength(1);

    const recipients = await CampaignRecipient.find({ campaignId: campaign._id }).lean();
    expect(recipients).toHaveLength(1);
    expect(recipients[0].status).toBe("sent");
  });

  it("skips recipients who withdraw consent after scheduling", async () => {
    const { campaign } = await seedCampaign();
    // withdraw consent before tick
    await applyMarketingConsent({
      email: EMAIL,
      channel: "email",
      status: "withdrawn",
      source: "unsubscribe_link",
    });

    await runCampaignTick({ now: new Date(), deadlineMs: Date.now() + 50_000 });
    expect(readQaMail()).toHaveLength(0);
    const recipient = await CampaignRecipient.findOne({ campaignId: campaign._id }).lean();
    expect(recipient?.status).toBe("skipped_consent");
  });

  it("ignores quiet hours for email", async () => {
    await seedCampaign();
    // run at 21:00 UTC (quiet hours) but email should still send
    const night = new Date("2026-01-15T21:00:00Z");
    await runCampaignTick({ now: night, deadlineMs: night.getTime() + 50_000 });
    expect(readQaMail()).toHaveLength(1);
  });
});
describe("Marketing module switch", () => {
  it("sends nothing and keeps the campaign scheduled while the module is off", async () => {
    const { campaign } = await seedCampaign();
    await Setting.updateOne({}, { $set: { enableMarketing: false } });

    const tick = await runCampaignTick({ now: new Date(), deadlineMs: Date.now() + 50_000 });
    expect(tick).toEqual({ locked: false, disabled: true });
    expect(readQaMail()).toHaveLength(0);
    const after = await Campaign.findById(campaign._id).lean<{ status: string }>();
    expect(after?.status).toBe("scheduled");

    await Setting.updateOne({}, { $set: { enableMarketing: true } });
    const resumed = await runCampaignTick({ now: new Date(), deadlineMs: Date.now() + 50_000 });
    expect(resumed.locked).toBe(true);
    expect(readQaMail()).toHaveLength(1);
  });

  it("treats a missing enableMarketing field as on", async () => {
    await seedCampaign();
    await Setting.collection.updateOne({}, { $unset: { enableMarketing: "" } });
    const tick = await runCampaignTick({ now: new Date(), deadlineMs: Date.now() + 50_000 });
    expect(tick.locked).toBe(true);
    expect(readQaMail()).toHaveLength(1);
  });
});
