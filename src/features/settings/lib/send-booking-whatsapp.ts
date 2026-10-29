import { connectDB } from "@/shared/db";
import { Booking } from "@/features/booking/model";
import { WhatsAppConfig } from "@/features/settings/model";
import { whatsappLocales } from "@/features/settings/schema/whatsapp.schema";
import { notify } from "@/features/notifications/notify";

function localeFor(value: string | undefined, fallback: string) {
  return whatsappLocales.includes(value as (typeof whatsappLocales)[number])
    ? value!
    : fallback;
}

export async function sendBookingWhatsApp(bookingId: string) {
  try {
    await connectDB();
    const [booking, config] = await Promise.all([
      Booking.findById(bookingId),
      WhatsAppConfig.findOne(),
    ]);
    if (!booking || !config?.enabled) return;

    await notify("booking_confirmed", {
      locale: localeFor(booking.locale, config.defaultLocale),
      bookingId: String(booking._id),
      customerEmail: booking.email,
      channels: ["whatsapp"],
      variables: {
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
      },
      recipients: {
        customer: [{
          phone: booking.phone,
          email: booking.email,
          name: `${booking.firstName} ${booking.lastName}`.trim(),
          whatsappOptIn: booking.whatsappOptIn,
        }],
      },
    });
  } catch (error) {
    console.error("WhatsApp confirmation failed:", error);
  }
}
