import { getCurrencySymbol } from "@/shared/lib/utils";
import { resolveAdminNotificationEmails } from "@/features/settings/lib/resolve-admin-emails";
import { getBakedSettings } from "@/shared/config/baked-settings";
import { deskRideUrl } from "@/features/booking/lib/booking-mail-url";
import { resolvePublicUrl } from "@/features/settings/lib/public-url";
import type { BookingEmailData } from "@/features/payments/lib/booking-email-data";
import { bookingPriceRows, bookingTrip } from "@/features/emails/lib/booking-rows";
import { prepareEventEmail, sendPreparedEmail } from "@/features/emails/lib/send-event-email";
import { NoticeEmail } from "@/features/emails/templates/notice-email";

export async function sendOrderNotificationEmail(bookingData: BookingEmailData) {
  try {
    const adminEmails = await resolveAdminNotificationEmails();
    if (adminEmails.length === 0) {
      console.error("No admin notification recipients configured.");
      return false;
    }

    const prepared = await prepareEventEmail({
      event: "new_booking_alert",
      audience: "desk",
      locale: "en",
      values: {
        name: `${bookingData.firstName} ${bookingData.lastName}`.trim(),
        tripId: bookingData.tripId,
        pickup: bookingData.pickup,
        dropoff: bookingData.dropoff,
        date: bookingData.date,
        time: bookingData.time,
        vehicle: bookingData.vehicleDetails?.name ?? "",
        total: Number(bookingData.totalAmount).toFixed(2),
      },
    });
    if (!prepared) return false;

    const currency =
      prepared.settings?.stripeCurrency ||
      getBakedSettings().stripeCurrency ||
      "EUR";
    const symbol = getCurrencySymbol(currency);
    const baseUrl =
      bookingData.baseUrl ||
      (await resolvePublicUrl().catch(() => null)) ||
      undefined;
    const deskUrl = deskRideUrl(baseUrl, bookingData.locale, bookingData.bookingId);
    const trip = bookingTrip(bookingData);

    let anySuccess = false;
    for (const adminEmail of adminEmails) {
      const sent = await sendPreparedEmail({
        prepared,
        to: adminEmail,
        element: (
          <NoticeEmail
            t={prepared.t}
            brand={prepared.brand}
            locale={prepared.locale}
            subject={prepared.copy.subject}
            intro={prepared.copy.intro}
            status={{ label: prepared.t("status_confirmed"), tone: "info" }}
            trip={trip}
            details={[
              {
                label: prepared.t("customer"),
                value: `${bookingData.firstName} ${bookingData.lastName}`,
              },
              { label: prepared.t("email"), value: bookingData.email },
              { label: prepared.t("phone"), value: bookingData.phone },
            ]}
            priceRows={bookingPriceRows(bookingData, symbol, prepared.t)}
            cta={deskUrl ? { url: deskUrl, label: prepared.t("open_desk") } : null}
          />
        ),
        links: [deskUrl],
      });
      if (sent) anySuccess = true;
    }
    return anySuccess;
  } catch (error) {
    console.error("sendOrderNotificationEmail:", error);
    return false;
  }
}
