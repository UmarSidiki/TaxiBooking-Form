import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resetTestDb } from "./helpers/db";
import CustomerProfile from "@/features/customers/model/CustomerProfile";
import Setting from "@/features/settings/model/Setting";
import { applyMarketingConsent } from "@/features/marketing/lib/consent/apply-marketing-consent";
import { handleWhatsAppStop } from "@/features/marketing/lib/consent/handle-whatsapp-stop";
import Suppression from "@/features/marketing/model/Suppression";
import MarketingConsent from "@/features/marketing/model/MarketingConsent";

const EMAIL = "ada@example.com";
const PHONE = "41791234567";

beforeEach(async () => {
  await resetTestDb();
  process.env.NEXTAUTH_SECRET = "test-secret";
  await Setting.create({ publicBaseUrl: "https://rides.example.com" });
  await CustomerProfile.create({
    email: EMAIL,
    name: "Ada",
    verifiedPhone: PHONE,
    marketing: { whatsapp: { status: "granted" } },
  });
  await applyMarketingConsent({
    email: EMAIL,
    channel: "whatsapp",
    status: "granted",
    source: "account",
  });
});

afterEach(() => {});

describe("whatsapp stop handling", () => {
  it("records withdrawn consent and suppression", async () => {
    await handleWhatsAppStop(PHONE + "@s.whatsapp.net");
    const profile = await CustomerProfile.findOne({ email: EMAIL }).lean();
    expect(profile?.marketing?.whatsapp?.status).toBe("withdrawn");
    const supp = await Suppression.findOne({
      channel: "whatsapp",
      key: PHONE,
    }).lean();
    expect(supp).not.toBeNull();
    const events = await MarketingConsent.find({
      emailLower: EMAIL,
      channel: "whatsapp",
      status: "withdrawn",
      source: "whatsapp_stop",
    }).lean();
    expect(events).toHaveLength(1);
  });
});
