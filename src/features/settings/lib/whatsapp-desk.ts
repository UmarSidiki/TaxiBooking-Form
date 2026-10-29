import { connectDB } from "@/shared/db";
import {
  WhatsAppConfig,
  WhatsAppDelivery,
  WhatsAppTemplate,
} from "@/features/settings/model";
import type {
  WhatsAppConfigWrite,
  WhatsAppTemplateWrite,
} from "@/features/settings/schema/whatsapp.schema";
import { renderWhatsAppTemplate, whatsappSampleValues } from "@/features/settings/lib/whatsapp-template-text";
import { toWhatsAppDigits, toWhatsAppJid } from "@/features/settings/lib/whatsapp-phone";
import { sendWhatsAppTexts } from "@/features/settings/lib/whatsapp-session";
import {
  deleteNotificationSetting,
  getNotificationSetting,
  getNotificationSettingById,
  listNotificationSettings,
  saveNotificationTemplate,
} from "@/features/notifications/lib/notification-settings";
import {
  legacyTemplates,
  sortTemplates,
  templatesFromSettings,
} from "@/features/settings/lib/whatsapp-desk-templates";

export async function loadWhatsAppDesk() {
  await connectDB();
  const [config, settings, legacy, deliveries] = await Promise.all([
    WhatsAppConfig.findOne().lean(),
    listNotificationSettings(),
    WhatsAppTemplate.find({ audience: { $in: ["customer", "desk"] } }).lean(),
    WhatsAppDelivery.find().sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  const templates = templatesFromSettings(settings);
  for (const row of legacyTemplates(legacy)) {
    const exists = templates.some(
      (item) =>
        item.event === row.event &&
        item.audience === row.audience &&
        item.locale === row.locale,
    );
    if (!exists) templates.push(row);
  }

  return {
    config: config ?? {
      enabled: false,
      defaultCallingCode: "",
      notifyNumbers: [],
      companyPhone: "",
      defaultLocale: "en",
      quietHours: { enabled: false, startHour: 22, endHour: 7 },
      requireOptIn: true,
    },
    templates: sortTemplates(templates),
    deliveries,
  };
}

export async function saveWhatsAppConfig(input: WhatsAppConfigWrite) {
  await connectDB();
  return WhatsAppConfig.findOneAndUpdate({}, input, {
    upsert: true,
    returnDocument: "after",
  }).lean();
}

export async function createWhatsAppTemplate(input: WhatsAppTemplateWrite) {
  await saveNotificationTemplate({
    event: input.event,
    channel: "whatsapp",
    audience: input.audience,
    locale: input.locale,
    template: { body: input.body },
    enabled: input.enabled,
  });
  return getNotificationSetting(input.event, "whatsapp", input.audience);
}

export async function updateWhatsAppTemplate(_id: string, input: WhatsAppTemplateWrite) {
  return createWhatsAppTemplate(input);
}

export async function deleteWhatsAppTemplate(id: string) {
  await connectDB();
  const setting = await getNotificationSettingById(id);
  if (setting) {
    await deleteNotificationSetting(id);
    return;
  }
  await WhatsAppTemplate.findByIdAndDelete(id);
}

export async function sendWhatsAppTest(templateId: string, to: string) {
  await connectDB();
  const [setting, legacy, config] = await Promise.all([
    getNotificationSettingById(templateId),
    WhatsAppTemplate.findById(templateId).lean(),
    WhatsAppConfig.findOne(),
  ]);
  if ((!setting && !legacy) || !config) {
    return { ok: false as const, error: "not_found" as const };
  }
  const digits = toWhatsAppDigits(to, config.defaultCallingCode);
  if (!digits) return { ok: false as const, error: "invalid_phone" as const };

  const body = setting
    ? (setting.templates[config.defaultLocale] ?? Object.values(setting.templates)[0])?.body
    : legacy?.body;
  if (!body) return { ok: false as const, error: "not_found" as const };

  const text = renderWhatsAppTemplate(body, {
    ...whatsappSampleValues,
    companyPhone: config.companyPhone || whatsappSampleValues.companyPhone,
  });
  const sent = await sendWhatsAppTexts([{ jid: toWhatsAppJid(digits), text }]);
  if (!sent.ok) return { ok: false as const, error: sent.reason };
  if (!sent.results[0]?.ok) return { ok: false as const, error: "failed" as const };
  return { ok: true as const };
}
