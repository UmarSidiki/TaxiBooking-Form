import { getCurrencySymbol } from "@/shared/lib/utils";
import { absoluteHttpBase } from "@/features/booking/lib/booking-mail-url";
import { createMagicLink } from "@/features/customers/lib/magic-link";
import type { BookingEmailData } from "@/features/payments/lib/booking-email-data";
import { bookingPriceRows, bookingTrip } from "@/features/emails/lib/booking-rows";
import { prepareEventEmail, sendPreparedEmail } from "@/features/emails/lib/send-event-email";
import { RequestEmail } from "@/features/emails/templates/request-email";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function sendRequestReceivedEmail(data: BookingEmailData) {
  try {
    if (!data.email || !isValidEmail(data.email)) return false;

    const prepared = await prepareEventEmail({
      event: "request_received",
      audience: "customer",
      locale: data.locale,
      values: {
        name: `${data.firstName} ${data.lastName}`.trim(),
        tripId: data.tripId,
      },
    });
    if (!prepared) return false;

    const symbol = getCurrencySymbol(prepared.settings?.stripeCurrency || "EUR");
    const manageUrl = await createMagicLink(data.email, {
      baseUrl: absoluteHttpBase(data.baseUrl),
      locale: prepared.locale,
      purpose: "email",
    });

    return sendPreparedEmail({
      prepared,
      to: data.email,
      element: (
        <RequestEmail
          variant="received"
          t={prepared.t}
          brand={prepared.brand}
          locale={prepared.locale}
          subject={prepared.copy.subject}
          intro={prepared.copy.intro}
          trip={bookingTrip(data)}
          priceRows={bookingPriceRows(data, symbol, prepared.t)}
          manageUrl={manageUrl}
        />
      ),
      links: [manageUrl],
    });
  } catch (error) {
    console.error("sendRequestReceivedEmail:", error);
    return false;
  }
}
