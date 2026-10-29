import { absoluteHttpBase } from "@/features/booking/lib/booking-mail-url";
import { customerPortalUrl } from "@/features/customers/lib/customer-token";
import type { BookingEmailData } from "@/features/payments/lib/booking-email-data";
import { bookingTrip } from "@/features/emails/lib/booking-rows";
import { prepareEventEmail, sendPreparedEmail } from "@/features/emails/lib/send-event-email";
import { RequestEmail } from "@/features/emails/templates/request-email";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function sendRequestDeclinedEmail(
  data: BookingEmailData & { declineReason?: string },
) {
  try {
    if (!data.email || !isValidEmail(data.email)) return false;

    const prepared = await prepareEventEmail({
      event: "request_declined",
      audience: "customer",
      locale: data.locale,
      values: {
        name: `${data.firstName} ${data.lastName}`.trim(),
        tripId: data.tripId,
        reason: data.declineReason ?? "",
      },
    });
    if (!prepared) return false;

    const manageUrl = customerPortalUrl(
      absoluteHttpBase(data.baseUrl),
      prepared.locale,
      data.email,
    );

    return sendPreparedEmail({
      prepared,
      to: data.email,
      element: (
        <RequestEmail
          variant="declined"
          t={prepared.t}
          brand={prepared.brand}
          locale={prepared.locale}
          subject={prepared.copy.subject}
          intro={prepared.copy.intro}
          trip={bookingTrip(data)}
          note={data.declineReason?.trim() || null}
          manageUrl={manageUrl}
        />
      ),
      links: [manageUrl],
    });
  } catch (error) {
    console.error("sendRequestDeclinedEmail:", error);
    return false;
  }
}
