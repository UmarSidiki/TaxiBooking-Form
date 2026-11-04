import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => {
  const sock = {
    sendMessage: vi.fn().mockResolvedValue({ key: { id: "wa-1" } }),
    end: vi.fn().mockResolvedValue(undefined),
    ev: { on: vi.fn(), off: vi.fn() },
  };
  const flushCreds = vi.fn(async () => undefined);
  return {
    sock,
    flushCreds,
    open: vi.fn(async () => ({ sock, linked: true, flushCreds })),
  };
});

vi.mock("@/features/settings/lib/whatsapp-socket", () => ({
  openWhatsAppSocket: h.open,
  waitForOpen: vi.fn(async () => undefined),
  isLoggedOut: () => false,
  WHATSAPP_OPEN_TIMEOUT_MS: 10_000,
}));

import { resetTestDb } from "./helpers/db";
import CustomerProfile from "@/features/customers/model/CustomerProfile";
import CustomerStats from "@/features/customers-admin/model/CustomerStats";
import Setting from "@/features/settings/model/Setting";
import Campaign from "@/features/marketing/model/Campaign";
import { createSegment } from "@/features/marketing/lib/segments/segment.repo";
import { createCampaignTemplate } from "@/features/marketing/lib/templates/campaign-template.repo";
import { campaignTemplateWriteSchema } from "@/features/marketing/schema/campaign-template.schema";
import { materialiseCampaignRecipients } from "@/features/marketing/lib/campaigns/materialise-recipients";
import { runCampaignTick } from "@/features/marketing/lib/campaigns/run-campaign-tick";
import { applyMarketingConsent } from "@/features/marketing/lib/consent/apply-marketing-consent";
import WhatsAppConfig from "@/features/settings/model/WhatsAppConfig";

const EMAIL = "ada@example.com";
const PHONE = "41791234567";

beforeEach(async () => {
  await resetTestDb();
  process.env.NEXTAUTH_SECRET = "test-secret";
  h.sock.sendMessage.mockReset();
  h.sock.sendMessage.mockResolvedValue({ key: { id: "wa-1" } });
  h.open.mockImplementation(async () => ({
    sock: h.sock,
    linked: true,
    flushCreds: h.flushCreds,
  }));
  await Setting.create({
    publicBaseUrl: "https://rides.example.com",
    timezone: "UTC",
    marketingWhatsappDailyCap: 100,
  });
  await WhatsAppConfig.create({ enabled: true, dailyCap: 300, sendRateLimit: 0 });
  await CustomerProfile.create({
    email: EMAIL,
    name: "Ada Lovelace",
    verifiedPhone: PHONE,
    marketing: { whatsapp: { status: "granted" } },
  });
  await CustomerStats.create({
    emailLower: EMAIL,
    name: "Ada Lovelace",
    nameLower: "ada lovelace",
    phoneDigits: PHONE,
    verifiedPhone: PHONE,
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
  h.sock.end.mockClear();
});

async function seedCampaign() {
  const segment = await createSegment({ name: "All", filter: {} as never });
  const template = await createCampaignTemplate(
    campaignTemplateWriteSchema.parse({
      channel: "whatsapp",
      name: "WA",
      locales: { en: { body: "Hi {{firstName}}, reply STOP to unsubscribe" } },
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
  return campaign;
}

describe("marketing whatsapp needs_scan", () => {
  it("pauses campaign when socket needs scan", async () => {
    const campaign = await seedCampaign();
    h.open.mockResolvedValueOnce({
      sock: h.sock,
      linked: false,
      flushCreds: h.flushCreds,
    });
    await runCampaignTick({
      now: new Date("2026-01-15T12:00:00Z"),
      deadlineMs: new Date("2026-01-15T12:00:00Z").getTime() + 50_000,
      sleep: async () => undefined,
    });
    const updated = await Campaign.findById(campaign._id).lean();
    expect(updated?.status).toBe("paused");
  });
});

describe("marketing whatsapp jitter", () => {
  it("uses 3-8s jitter", async () => {
    await seedCampaign();
    const sleeps: number[] = [];
    const sleep = async (ms: number) => {
      sleeps.push(ms);
    };
    await runCampaignTick({
      now: new Date("2026-01-15T12:00:00Z"),
      deadlineMs: new Date("2026-01-15T12:00:00Z").getTime() + 50_000,
      sleep,
      rng: () => 0,
    });
    expect(sleeps.length).toBe(1);
    // rng()=0 -> delay = 3000 + 0 = 3000
    expect(sleeps[0]).toBe(3000);
  });
});
