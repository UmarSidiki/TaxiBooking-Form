import { getCurrencySymbol } from "@/shared/lib/utils";
import { resolveAdminNotificationEmails } from "@/features/settings/lib/resolve-admin-emails";
import { deskRideUrl } from "@/features/booking/lib/booking-mail-url";
import type { BookingEmailData } from "@/features/payments/lib/booking-email-data";
import { bookingPriceRows, bookingTrip } from "@/features/emails/lib/booking-rows";
import { prepareEventEmail, sendPreparedEmail } from "@/features/emails/lib/send-event-email";
import { NoticeEmail } from "@/features/emails/templates/notice-email";

export async function sendNewAppointmentRequestAdminEmail(data: BookingEmailData) {
  try {
    const recipients = await resolveAdminNotificationEmails();
    if (!recipients.length) return false;

    const prepared = await prepareEventEmail({
      event: "new_request_alert",
      audience: "desk",
      locale: "en",
      values: {
        name: `${data.firstName} ${data.lastName}`.trim(),
        tripId: data.tripId,
        pickup: data.pickup,
        dropoff: data.dropoff,
        date: data.date,
        time: data.time,
        vehicle: data.vehicleDetails?.name ?? "",
        total: Number(data.totalAmount).toFixed(2),
        duration: data.duration ?? "",
      },
    });
    if (!prepared) return false;

    const symbol = getCurrencySymbol(prepared.settings?.stripeCurrency || "EUR");
    const deskUrl = deskRideUrl(data.baseUrl, data.locale, data.bookingId);

    let anySuccess = false;
    for (const to of recipients) {
      const sent = await sendPreparedEmail({
        prepared,
        to,
        element: (
          <NoticeEmail
            t={prepared.t}
            brand={prepared.brand}
            locale={prepared.locale}
            subject={prepared.copy.subject}
            intro={prepared.copy.intro}
            status={{ label: prepared.t("status_pending"), tone: "warning" }}
            trip={bookingTrip(data)}
            details={[
              {
                label: prepared.t("customer"),
                value: `${data.firstName} ${data.lastName}`,
              },
              { label: prepared.t("email"), value: data.email },
              { label: prepared.t("phone"), value: data.phone },
            ]}
            priceRows={bookingPriceRows(data, symbol, prepared.t)}
            cta={deskUrl ? { url: deskUrl, label: prepared.t("open_desk") } : null}
          />
        ),
        links: [deskUrl],
      });
      if (sent) anySuccess = true;
    }
    return anySuccess;
  } catch (error) {
    console.error("sendNewAppointmentRequestAdminEmail:", error);
    return false;
  }
}
