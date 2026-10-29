import { Booking } from "@/features/booking/model";
import { Vehicle } from "@/features/fleet/model";
import { WhatsAppConfig } from "@/features/settings/model";
import { whatsappLocales } from "@/features/settings/schema/whatsapp.schema";
import { notify } from "@/features/notifications/notify";

export const CUSTOMER_RIDE_EVENTS = [
  "driver_assigned",
  "on_the_way",
  "arrived",
  "completed",
] as const;

export type CustomerRideEvent = (typeof CUSTOMER_RIDE_EVENTS)[number];

function localeFor(value: string | undefined, fallback: string) {
  return whatsappLocales.includes(value as (typeof whatsappLocales)[number])
    ? value!
    : fallback;
}

export async function sendCustomerRideUpdate(bookingId: string, event: CustomerRideEvent) {
  const [booking, config] = await Promise.all([
    Booking.findById(bookingId),
    WhatsAppConfig.findOne(),
  ]);
  if (!booking || !config?.enabled || !booking.whatsappOptIn) {
    return { ok: true as const, sent: 0 };
  }

  const vehicle = booking.selectedVehicle
    ? await Vehicle.findById(booking.selectedVehicle).select("name plate")
    : null;
  const result = await notify(event, {
    locale: localeFor(booking.locale, config.defaultLocale),
    customerEmail: booking.email,
    variables: {
      name: `${booking.firstName} ${booking.lastName}`.trim(),
      tripId: booking.tripId,
      pickup: booking.pickup,
      dropoff: booking.dropoff ?? "",
      date: booking.date,
      time: booking.time,
      vehicle: vehicle?.name || booking.vehicleDetails?.name || "",
      plate: vehicle?.plate || "",
      driver: booking.assignedDriver?.name || "",
      total: typeof booking.totalAmount === "number" ? booking.totalAmount.toFixed(2) : "",
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

  return {
    ok: result.ok,
    sent: result.deliveries.filter((delivery) => delivery.channel === "whatsapp").length,
  };
}
