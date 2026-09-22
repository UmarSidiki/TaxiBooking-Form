import { sendEmail } from "@/features/settings/lib/email";
import { connectDB } from "@/shared/db";
import { Setting } from "@/features/settings/model";
import { getCurrencySymbol } from "@/shared/lib/utils";
import { confirmationEmailHtml } from "@/features/booking/email/order-confirmation-html";
import { invoiceDownloadUrl } from "@/features/booking/lib/booking-mail-url";
import { renderInvoicePdf } from "@/features/booking/lib/render-invoice-pdf";
import type { BookingEmailData } from "@/features/payments/lib/booking-email-data";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function sendOrderConfirmationEmail(bookingData: BookingEmailData) {
  try {
    if (!bookingData.email || !isValidEmail(bookingData.email)) {
      console.error("Invalid customer email address:", bookingData.email);
      return false;
    }

    await connectDB();
    const settings = await Setting.findOne();
    const fromAddress = settings?.smtpFrom || settings?.smtpUser || "noreply@booking.com";
    const fromField = settings?.smtpSenderName
      ? `${settings.smtpSenderName} <${fromAddress}>`
      : fromAddress;
    const currency = settings?.stripeCurrency || "EUR";
    const currencySymbol = getCurrencySymbol(currency);
    const primaryColor = settings?.primaryColor || "#EAB308";
    const invoiceUrl = invoiceDownloadUrl(bookingData.baseUrl, bookingData.tripId);

    let invoiceAttached = false;
    let pdf: Buffer | null = null;
    try {
      pdf = await renderInvoicePdf(
        bookingData,
        currencySymbol,
        settings?.smtpSenderName || "Booking Service"
      );
      invoiceAttached = true;
    } catch (error) {
      console.error("Invoice PDF failed for", bookingData.tripId, error);
    }

    const html = confirmationEmailHtml(bookingData, {
      currency,
      primaryColor,
      supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
      invoiceUrl,
      invoiceAttached,
    });

    const success = await sendEmail({
      from: fromField,
      to: bookingData.email,
      subject: `Booking Confirmation - Reservation #${bookingData.tripId}`,
      html,
      text: `Booking Confirmed\n\nReservation ID: ${bookingData.tripId}\nFrom: ${bookingData.pickup}${bookingData.bookingType === "hourly" ? `\nDuration: ${bookingData.duration ? `${bookingData.duration} hours` : "Hourly"}` : `\nTo: ${bookingData.dropoff}`}\nDeparture: ${bookingData.date} at ${bookingData.time}\nVehicle: ${bookingData.vehicleDetails.name}\nTotal: ${currencySymbol}${bookingData.totalAmount.toFixed(2)}${invoiceAttached ? "\n\nYour invoice is attached." : ""}${invoiceUrl ? `\nInvoice: ${invoiceUrl}` : ""}`,
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

    if (!success) {
      console.error("Failed to send confirmation email to:", bookingData.email);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    return false;
  }
}
