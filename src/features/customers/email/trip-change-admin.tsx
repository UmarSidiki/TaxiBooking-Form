import { resolveAdminNotificationEmails } from "@/features/settings/lib/resolve-admin-emails";
import { resolvePublicUrl } from "@/features/settings/lib/public-url";
import { deskRideUrl } from "@/features/booking/lib/booking-mail-url";
import { prepareEventEmail, sendPreparedEmail } from "@/features/emails/lib/send-event-email";
import { NoticeEmail } from "@/features/emails/templates/notice-email";
import type { IBooking } from "@/features/booking/model";
import type { EmailTrip } from "@/features/emails/types";

function tripOf(booking: IBooking): EmailTrip {
  return {
    tripId: booking.tripId,
    pickup: booking.pickup,
    dropoff: booking.dropoff || null,
    stops: booking.stops ?? [],
    date: booking.date,
    time: booking.time,
    vehicle: booking.vehicleDetails?.name ?? null,
    passengers: booking.passengers,
    flightNumber: booking.flightNumber,
  };
}

/** Operators are told about customer-initiated cancellations and changes. */
export async function sendTripChangeAdminEmail(
  booking: IBooking,
  kind: "cancel" | "change",
) {
  const recipients = await resolveAdminNotificationEmails();
  if (recipients.length === 0) return;

  const prepared = await prepareEventEmail({
    event: "trip_change_admin",
    audience: "desk",
    locale: "en",
    values: {
      name: `${booking.firstName} ${booking.lastName}`.trim(),
      tripId: booking.tripId,
      pickup: booking.pickup,
      dropoff: booking.dropoff || "",
      date: booking.date,
      time: booking.time,
      total: String(booking.totalAmount ?? 0),
    },
  });
  if (!prepared) return;

  const base = await resolvePublicUrl().catch(() => null);
  const deskUrl = deskRideUrl(base ?? undefined, booking.locale, String(booking._id));
  const status =
    kind === "cancel"
      ? { label: prepared.t("status_cancelled"), tone: "danger" as const }
      : { label: prepared.t("status_pending"), tone: "warning" as const };

  await Promise.all(
    recipients.map((to) =>
      sendPreparedEmail({
        prepared,
        to,
        element: (
          <NoticeEmail
            t={prepared.t}
            brand={prepared.brand}
            locale={prepared.locale}
            subject={prepared.copy.subject}
            intro={prepared.copy.intro}
            status={status}
            trip={tripOf(booking)}
            details={[
              {
                label: prepared.t("customer"),
                value: `${booking.firstName} ${booking.lastName}`,
              },
              { label: prepared.t("email"), value: booking.email },
              { label: prepared.t("phone"), value: booking.phone },
              { label: prepared.t("total"), value: String(booking.totalAmount ?? 0) },
            ]}
            cta={deskUrl ? { url: deskUrl, label: prepared.t("open_desk") } : null}
          />
        ),
        links: [deskUrl],
      }).catch(() => false),
    ),
  );
}
