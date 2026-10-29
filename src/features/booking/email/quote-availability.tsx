import { getCurrencySymbol } from "@/shared/lib/utils";
import { absoluteHttpBase } from "@/features/booking/lib/booking-mail-url";
import { customerPortalUrl } from "@/features/customers/lib/customer-token";
import type { BookingEmailData } from "@/features/payments/lib/booking-email-data";
import { bookingPriceRows, bookingTrip } from "@/features/emails/lib/booking-rows";
import { prepareEventEmail, sendPreparedEmail } from "@/features/emails/lib/send-event-email";
import { RequestEmail } from "@/features/emails/templates/request-email";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function sendQuoteEmail(data: BookingEmailData & { payUrl: string }) {
  try {
    if (!data.email || !isValidEmail(data.email)) return false;

    const prepared = await prepareEventEmail({
      event: "quote_pay_link",
      audience: "customer",
      locale: data.locale,
      values: {
        name: `${data.firstName} ${data.lastName}`.trim(),
        tripId: data.tripId,
        payUrl: data.payUrl,
        total: Number(data.totalAmount).toFixed(2),
      },
    });
    if (!prepared) return false;

    const symbol = getCurrencySymbol(prepared.settings?.stripeCurrency || "EUR");
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
          variant="quote"
          t={prepared.t}
          brand={prepared.brand}
          locale={prepared.locale}
          subject={prepared.copy.subject}
          intro={prepared.copy.intro}
          trip={bookingTrip(data)}
          priceRows={bookingPriceRows(data, symbol, prepared.t)}
          payUrl={data.payUrl}
          payLabel={prepared.t("pay_cta", {
            amount: `${symbol}${Number(data.totalAmount).toFixed(2)}`,
          })}
          manageUrl={manageUrl}
        />
      ),
      links: [data.payUrl, manageUrl],
    });
  } catch (error) {
    console.error("sendQuoteEmail:", error);
    return false;
  }
}
