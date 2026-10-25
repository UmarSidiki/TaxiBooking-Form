import { Driver } from "@/features/drivers/model";
import { Vehicle } from "@/features/fleet/model";
import { sendEmail } from "@/features/settings/lib/email";
import { WhatsAppConfig } from "@/features/settings/model";
import { sendWhatsAppTexts } from "@/features/settings/lib/whatsapp-session";
import { toWhatsAppJid } from "@/features/settings/lib/whatsapp-phone";

export async function expiringDocuments(now = new Date()) {
  const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const [drivers, vehicles] = await Promise.all([
    Driver.find({ "documents.expiresAt": { $lte: soon } }).select("name documents.expiresAt documents.type").limit(50).lean(),
    Vehicle.find({ insuranceExpiresAt: { $lte: soon } }).select("name insuranceExpiresAt").limit(50).lean(),
  ]);
  return { drivers, vehicles };
}

export async function alertExpiringDocuments(now = new Date()) {
  const { drivers, vehicles } = await expiringDocuments(now);
  if (!drivers.length && !vehicles.length) return { success: true, sent: 0 };
  const lines = [
    ...drivers.map((driver) => `Driver ${driver.name}`),
    ...vehicles.map((vehicle) => `Vehicle ${vehicle.name}`),
  ];
  const text = `Documents expiring within 30 days:\n${lines.join("\n")}`;
  await sendEmail({ to: process.env.ADMIN_EMAIL || "admin@localhost", subject: "Document expiry", text });
  const config = await WhatsAppConfig.findOne().lean();
  if (config?.notifyNumbers?.length) {
    await sendWhatsAppTexts(config.notifyNumbers.slice(0, 5).map((phone: string) => ({
      jid: toWhatsAppJid(phone.replace(/\D/g, "")),
      text,
    })));
  }
  return { success: true, sent: lines.length };
}
