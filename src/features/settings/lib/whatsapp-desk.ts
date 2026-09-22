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

export async function loadWhatsAppDesk() {
  await connectDB();
  const [config, templates, deliveries] = await Promise.all([
    WhatsAppConfig.findOne().lean(),
    WhatsAppTemplate.find({ event: "booking_confirmed" }).sort({ updatedAt: -1 }).limit(40).lean(),
    WhatsAppDelivery.find().sort({ createdAt: -1 }).limit(20).lean(),
  ]);
  return {
    config: config ?? {
      enabled: false,
      defaultCallingCode: "",
      notifyNumbers: [],
      companyPhone: "",
      defaultLocale: "en",
    },
    templates,
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

async function clearOtherEnabled(audience: string, locale: string, keepId?: string) {
  await WhatsAppTemplate.updateMany(
    {
      event: "booking_confirmed",
      audience,
      locale,
      enabled: true,
      ...(keepId ? { _id: { $ne: keepId } } : {}),
    },
    { $set: { enabled: false } }
  );
}

export async function createWhatsAppTemplate(input: WhatsAppTemplateWrite) {
  await connectDB();
  if (input.enabled) await clearOtherEnabled(input.audience, input.locale);
  return WhatsAppTemplate.create({ ...input, event: "booking_confirmed" });
}

export async function updateWhatsAppTemplate(id: string, input: WhatsAppTemplateWrite) {
  await connectDB();
  if (input.enabled) await clearOtherEnabled(input.audience, input.locale, id);
  return WhatsAppTemplate.findByIdAndUpdate(id, input, { returnDocument: "after" }).lean();
}

export async function deleteWhatsAppTemplate(id: string) {
  await connectDB();
  await WhatsAppTemplate.findByIdAndDelete(id);
}

export async function sendWhatsAppTest(templateId: string, to: string) {
  await connectDB();
  const [template, config] = await Promise.all([
    WhatsAppTemplate.findById(templateId),
    WhatsAppConfig.findOne(),
  ]);
  if (!template || !config) return { ok: false as const, error: "not_found" as const };
  const digits = toWhatsAppDigits(to, config.defaultCallingCode);
  if (!digits) return { ok: false as const, error: "invalid_phone" as const };
  const text = renderWhatsAppTemplate(template.body, {
    ...whatsappSampleValues,
    companyPhone: config.companyPhone || whatsappSampleValues.companyPhone,
  });
  const sent = await sendWhatsAppTexts([{ jid: toWhatsAppJid(digits), text }]);
  if (!sent.ok) return { ok: false as const, error: sent.reason };
  if (!sent.results[0]?.ok) return { ok: false as const, error: "failed" as const };
  return { ok: true as const };
}
