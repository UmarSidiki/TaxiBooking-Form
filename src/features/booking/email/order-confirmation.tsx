import { getCurrencySymbol } from "@/shared/lib/utils";
import { absoluteHttpBase, invoiceDownloadUrl } from "@/features/booking/lib/booking-mail-url";
import { customerPortalUrl } from "@/features/customers/lib/customer-token";
import { buildInvoicePdf } from "@/features/invoices/lib/build-invoice-pdf";
import type { BookingEmailData } from "@/features/payments/lib/booking-email-data";
import { bookingPriceRows, bookingTrip } from "@/features/emails/lib/booking-rows";
import { prepareEventEmail, sendPreparedEmail } from "@/features/emails/lib/send-event-email";
import { BookingConfirmedEmail } from "@/features/emails/templates/booking-confirmed-email";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function sendOrderConfirmationEmail(bookingData: BookingEmailData) {
  try {
    if (!bookingData.email || !isValidEmail(bookingData.email)) {
      console.error("Invalid customer email address:", bookingData.email);
      return false;
    }

    const prepared = await prepareEventEmail({
      event: "booking_confirmed",
      audience: "customer",
      locale: bookingData.locale,
      values: {
        name: `${bookingData.firstName} ${bookingData.lastName}`.trim(),
        tripId: bookingData.tripId,
        pickup: bookingData.pickup,
        dropoff: bookingData.dropoff,
        date: bookingData.date,
        time: bookingData.time,
        vehicle: bookingData.vehicleDetails?.name ?? "",
        total: Number(bookingData.totalAmount).toFixed(2),
        passengers: bookingData.passengers,
      },
    });
    if (!prepared) return false;

    const invoiceUrl = invoiceDownloadUrl(bookingData.baseUrl, bookingData.tripId);
    const portalUrl = customerPortalUrl(
      absoluteHttpBase(bookingData.baseUrl),
      prepared.locale,
      bookingData.email,
    );
    const currencySymbol = getCurrencySymbol(
      prepared.settings?.stripeCurrency || "EUR",
    );

    let pdf: Buffer | null = null;
    try {
      pdf = (await buildInvoicePdf(bookingData.tripId))?.pdf ?? null;
    } catch (error) {
      console.error("Invoice PDF failed for", bookingData.tripId, error);
    }

    return sendPreparedEmail({
      prepared,
      to: bookingData.email,
      element: (
        <BookingConfirmedEmail
          t={prepared.t}
          brand={prepared.brand}
          locale={prepared.locale}
          subject={prepared.copy.subject}
          intro={prepared.copy.intro}
          trip={bookingTrip(bookingData)}
          priceRows={bookingPriceRows(bookingData, currencySymbol, prepared.t)}
          manageUrl={portalUrl}
          invoiceUrl={invoiceUrl}
          invoiceAttached={Boolean(pdf)}
          notes={bookingData.notes}
        />
      ),
      links: [invoiceUrl, portalUrl],
      attachments: pdf
        ? [
            {
              filename: `Invoice-${bookingData.tripId}.pdf`,
              content: pdf,
              contentType: "application/pdf",
            },
          ]
        : undefined,
    });
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    return false;
  }
}
