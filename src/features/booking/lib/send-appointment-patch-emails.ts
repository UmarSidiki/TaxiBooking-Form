import { sendQuoteEmail } from "@/features/booking/email/quote-availability";
import { sendRequestDeclinedEmail } from "@/features/booking/email/request-declined";
import { sendOrderConfirmationEmail } from "@/features/booking/email/order-confirmation";
import {
  absoluteHttpBase,
  bookingMailLocale,
} from "@/features/booking/lib/booking-mail-url";
import { getSettingsCurrency } from "@/features/booking/lib/get-settings-currency";
import { initCashBookingPartners } from "@/features/booking/lib/init-cash-booking-partners";
import { updateBookingFields } from "@/features/booking/lib/booking.repo";
import { buildBookingEmailDataFromBooking } from "@/features/payments/lib/booking-email-data";
import type { BookingPatchAction } from "@/features/booking/schema/booking-patch.schema";
import type { IBooking } from "@/features/booking/model";

export type AppointmentPatchEmailResult =
  | { ok: true }
  | { ok: false; message: string };

export async function sendAppointmentPatchEmails(input: {
  action: BookingPatchAction;
  booking: IBooking;
  paymentToken?: string;
  baseUrl?: string;
}): Promise<AppointmentPatchEmailResult> {
  const { action, booking, paymentToken, baseUrl } = input;
  if (action !== "quote" && action !== "confirmcash" && action !== "decline") {
    return { ok: true };
  }

  const currency = await getSettingsCurrency();
  const emailData = buildBookingEmailDataFromBooking(booking, {
    paymentMethod: booking.paymentMethod || "pending",
    currency,
    baseUrl,
  });

  if (action === "quote") {
    if (!paymentToken) {
      return { ok: false, message: "Pay token missing after quote" };
    }
    const base = absoluteHttpBase(baseUrl);
    if (!base) {
      return {
        ok: false,
        message:
          "Cannot send pay link: set NEXT_PUBLIC_BASE_URL or call from a browser origin",
      };
    }
    const locale = bookingMailLocale(booking.locale);
    const payUrl = `${base}/${locale}/pay/${encodeURIComponent(paymentToken)}`;
    const sent = await sendQuoteEmail({ ...emailData, payUrl });
    if (!sent) {
      return {
        ok: false,
        message: "Quoted, but the pay-link email failed to send. Check SMTP.",
      };
    }
    await updateBookingFields(String(booking._id), { quoteEmailSent: true });
    return { ok: true };
  }

  if (action === "confirmcash") {
    const sent = await sendOrderConfirmationEmail(emailData);
    if (sent) {
      await updateBookingFields(String(booking._id), {
        confirmationEmailSent: true,
      });
    }
    await initCashBookingPartners(
      String(booking._id),
      "cash",
      booking.totalAmount ?? 0,
      baseUrl
    );
    return { ok: true };
  }

  if (action === "decline") {
    await sendRequestDeclinedEmail({
      ...emailData,
      declineReason: booking.declineReason,
    });
  }

  return { ok: true };
}
