import { Booking } from "@/features/booking/model";
import { Vehicle } from "@/features/fleet/model";
import { absoluteHttpBase } from "@/features/booking/lib/booking-mail-url";
import { resolvePublicUrl } from "@/features/settings/lib/public-url";
import { readCustomerToken, signCustomerToken } from "@/features/customers/lib/customer-token";
import { WhatsAppConfig, WhatsAppTemplate } from "@/features/settings/model";
import { renderWhatsAppTemplate } from "@/features/settings/lib/whatsapp-template-text";
import { toWhatsAppDigits, toWhatsAppJid } from "@/features/settings/lib/whatsapp-phone";
import { sendWhatsAppTexts } from "@/features/settings/lib/whatsapp-session";

export const CUSTOMER_RIDE_EVENTS = ["driver_assigned", "on_the_way", "arrived", "completed"] as const;
export type CustomerRideEvent = (typeof CUSTOMER_RIDE_EVENTS)[number];

export async function rideStatusUrl(locale: string, tripId: string) {
  const base = absoluteHttpBase(await resolvePublicUrl());
  const token = signCustomerToken(`${locale}|${tripId}`, 60 * 60 * 24 * 14);
  if (!base || !token) return "";
  return `${base}/${locale}/ride-status?token=${encodeURIComponent(token)}`;
}

export function readRideStatusToken(token: string | null) {
  const raw = token ? readCustomerToken(token) : null;
  if (!raw || !raw.includes("|")) return null;
  const [locale, tripId] = raw.split("|");
  return locale && tripId ? { locale, tripId } : null;
}

export async function sendCustomerRideUpdate(bookingId: string, event: CustomerRideEvent) {
  const [booking, config] = await Promise.all([Booking.findById(bookingId), WhatsAppConfig.findOne()]);
  if (!booking || !config?.enabled || !booking.whatsappOptIn) return { ok: true as const, sent: 0 };
  const template = await WhatsAppTemplate.findOne({ event, audience: "customer", enabled: true });
  if (!template) return { ok: true as const, sent: 0 };
  const vehicle = booking.selectedVehicle ? await Vehicle.findById(booking.selectedVehicle).select("name plate") : null;
  const digits = toWhatsAppDigits(booking.phone, config.defaultCallingCode);
  if (!digits) return { ok: true as const, sent: 0 };
  const text = renderWhatsAppTemplate(template.body, {
    name: `${booking.firstName} ${booking.lastName}`.trim(),
    tripId: booking.tripId,
    pickup: booking.pickup,
    dropoff: booking.dropoff ?? "",
    date: booking.date,
    time: booking.time,
    vehicle: vehicle?.name || booking.vehicleDetails?.name || "",
    plate: vehicle?.plate || "",
    driver: booking.assignedDriver?.name || "",
    statusUrl: await rideStatusUrl(booking.locale || "en", booking.tripId),
    total: typeof booking.totalAmount === "number" ? booking.totalAmount.toFixed(2) : "",
  });
  const sent = await sendWhatsAppTexts([{ jid: toWhatsAppJid(digits), text }]);
  return { ok: sent.ok, sent: sent.ok ? 1 : 0 };
}
