import { connectDB } from "@/shared/db";
import { Booking } from "@/features/booking/model";
import {
  WhatsAppConfig,
  WhatsAppDelivery,
  WhatsAppTemplate,
} from "@/features/settings/model";
import { whatsappLocales } from "@/features/settings/schema/whatsapp.schema";
import { renderWhatsAppTemplate } from "@/features/settings/lib/whatsapp-template-text";
import { toWhatsAppDigits, toWhatsAppJid } from "@/features/settings/lib/whatsapp-phone";
import { sendWhatsAppTexts } from "@/features/settings/lib/whatsapp-session";

type Audience = "customer" | "desk";

type Job = {
  audience: Audience;
  to: string;
  text: string;
};

function isLocale(value: string | undefined): value is (typeof whatsappLocales)[number] {
  return whatsappLocales.includes(value as (typeof whatsappLocales)[number]);
}

function isDuplicateKey(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: number }).code === 11000
  );
}

export async function sendBookingWhatsApp(bookingId: string) {
  try {
    await connectDB();
    const [booking, config] = await Promise.all([
      Booking.findById(bookingId),
      WhatsAppConfig.findOne(),
    ]);
    if (!booking || !config?.enabled) return;

    const locale = isLocale(booking.locale) ? booking.locale : config.defaultLocale;
    const templates = await WhatsAppTemplate.find({
      event: "booking_confirmed",
      enabled: true,
      locale: { $in: [locale, config.defaultLocale] },
    });

    const pick = (audience: Audience) =>
      templates.find((item) => item.audience === audience && item.locale === locale) ??
      templates.find((item) => item.audience === audience && item.locale === config.defaultLocale);

    const values = {
      name: `${booking.firstName} ${booking.lastName}`.trim(),
      tripId: booking.tripId,
      pickup: booking.pickup,
      dropoff: booking.dropoff ?? "",
      date: booking.date,
      time: booking.time,
      vehicle: booking.vehicleDetails?.name ?? "",
      total: typeof booking.totalAmount === "number" ? booking.totalAmount.toFixed(2) : "",
      passengers: String(booking.passengers),
      companyPhone: config.companyPhone,
    };

    const jobs: Job[] = [];
    const customer = pick("customer");
    const customerDigits = toWhatsAppDigits(booking.phone, config.defaultCallingCode);
    if (booking.whatsappOptIn && customer && customerDigits) {
      jobs.push({
        audience: "customer",
        to: customerDigits,
        text: renderWhatsAppTemplate(customer.body, values),
      });
    }

    const desk = pick("desk");
    if (desk) {
      for (const phone of config.notifyNumbers.slice(0, 5)) {
        const digits = toWhatsAppDigits(phone, config.defaultCallingCode);
        if (!digits) continue;
        jobs.push({
          audience: "desk",
          to: digits,
          text: renderWhatsAppTemplate(desk.body, values),
        });
      }
    }

    const claimed = (
      await Promise.all(
        jobs.map(async (job) => {
          try {
            await WhatsAppDelivery.create({ ...job, bookingId, status: "sending" });
            return job;
          } catch (error) {
            if (isDuplicateKey(error)) return null;
            throw error;
          }
        })
      )
    ).filter((job): job is Job => job !== null);

    if (claimed.length === 0) return;

    const sent = await sendWhatsAppTexts(
      claimed.map((job) => ({ jid: toWhatsAppJid(job.to), text: job.text }))
    );

    await Promise.all(
      claimed.map((job) => {
        const result = sent.ok
          ? sent.results.find((item) => item.jid === toWhatsAppJid(job.to))
          : undefined;
        return WhatsAppDelivery.updateOne(
          { bookingId, audience: job.audience, to: job.to },
          { $set: { status: result?.ok ? "sent" : "failed" } }
        );
      })
    );
  } catch (error) {
    console.error("WhatsApp confirmation failed:", error);
  }
}
