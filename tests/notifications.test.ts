import { beforeEach, describe, expect, it } from "vitest";
import { Setting, WhatsAppConfig } from "@/features/settings/model";
import NotificationSetting from "@/features/notifications/model/NotificationSetting";
import {
  NOTIFICATION_EVENTS,
  notificationEventKeys,
  type NotificationEventKey,
} from "@/features/notifications/notification-events";
import { notify } from "@/features/notifications/notify";
import { clearWhatsAppOutbox, readWhatsAppOutbox } from "@/features/settings/lib/whatsapp-outbox";
import type { NotificationContext } from "@/features/notifications/notification-types";

function variablesFor(key: NotificationEventKey) {
  return Object.fromEntries(
    NOTIFICATION_EVENTS[key].variables.map((name) => [name, name === "documents" ? "Licence expires" : `sample-${name}`]),
  );
}

function contextFor(key: NotificationEventKey): NotificationContext {
  const definition = NOTIFICATION_EVENTS[key];
  const recipients: NotificationContext["recipients"] = {};
  if (definition.audiences.includes("customer")) {
    recipients.customer = [{ phone: "+14155552671", email: "customer@example.com", whatsappOptIn: true }];
  }
  if (definition.audiences.includes("driver")) {
    recipients.driver = [{ phone: "+14155552672" }];
  }
  if (definition.audiences.includes("partner")) {
    recipients.partner = [{ phone: "+14155552673" }];
  }
  return {
    locale: "en",
    baseUrl: "https://example.com",
    customerEmail: "customer@example.com",
    variables: variablesFor(key),
    recipients,
  };
}

beforeEach(async () => {
  process.env.QA_MOCK_WHATSAPP = "1";
  process.env.QA_MOCK_EMAIL = "1";
  process.env.NEXTAUTH_SECRET = "test-secret";
  clearWhatsAppOutbox();
  await WhatsAppConfig.create({ enabled: true, notifyNumbers: ["+14155552671"] });
  await Setting.create({ adminEmail: "desk@example.com" });
});

describe("notification registry", () => {
  it("queues nothing while disabled and a rendered message once enabled", async () => {
    for (const key of notificationEventKeys) {
      const definition = NOTIFICATION_EVENTS[key];
      for (const channel of definition.channels) {
        for (const audience of definition.audiences) {
          await NotificationSetting.updateOne(
            { event: key, channel, audience },
            { $set: { enabled: false, templates: {} } },
            { upsert: true },
          );
        }
      }

      clearWhatsAppOutbox();
      const disabled = await notify(key, contextFor(key));
      expect(disabled.queued, `${key} disabled`).toBe(0);

      await NotificationSetting.updateMany({ event: key }, { $set: { enabled: true } });
      clearWhatsAppOutbox();
      const enabled = await notify(key, contextFor(key));
      expect(enabled.queued, `${key} enabled`).toBeGreaterThan(0);

      if (definition.channels.includes("whatsapp")) {
        const text = readWhatsAppOutbox().at(-1)?.text ?? "";
        expect(text.length, `${key} whatsapp text`).toBeGreaterThan(0);
        expect(text, `${key} renders every variable`).not.toContain("{{");
      }
    }
  });

  it("uses the translated default when no template was stored", async () => {
    await NotificationSetting.create({
      event: "booking_cancelled",
      channel: "whatsapp",
      audience: "customer",
      enabled: true,
      templates: {},
    });
    await notify("booking_cancelled", {
      locale: "fr",
      variables: { name: "Ada", tripId: "T9" },
      recipients: { customer: [{ phone: "+14155552671", whatsappOptIn: true }] },
    });
    expect(readWhatsAppOutbox().at(-1)?.text).toContain("a été annulée");
  });

  it("prefers a stored per-locale template over the code default", async () => {
    await NotificationSetting.create({
      event: "booking_cancelled",
      channel: "whatsapp",
      audience: "customer",
      enabled: true,
      templates: {
        en: { body: "Custom {{tripId}}" },
        fr: { body: "Perso {{tripId}}" },
      },
    });
    await notify("booking_cancelled", {
      locale: "fr",
      variables: { tripId: "T9" },
      recipients: { customer: [{ phone: "+14155552671", whatsappOptIn: true }] },
    });
    expect(readWhatsAppOutbox().at(-1)?.text).toBe("Perso T9");
  });

  it("does not message a customer who has not opted in to WhatsApp", async () => {
    await NotificationSetting.create({
      event: "booking_cancelled",
      channel: "whatsapp",
      audience: "customer",
      enabled: true,
      templates: {},
    });
    await notify("booking_cancelled", {
      locale: "en",
      variables: { name: "Ada", tripId: "T9" },
      recipients: { customer: [{ phone: "+14155552671", whatsappOptIn: false }] },
    });
    expect(readWhatsAppOutbox()).toHaveLength(0);
  });
});
