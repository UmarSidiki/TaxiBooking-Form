import { sendEmail } from "@/features/settings/lib/email";
import { resolveAdminNotificationEmails } from "@/features/settings/lib/resolve-admin-emails";
import { connectDB } from "@/shared/db";
import { Setting } from "@/features/settings/model";
import { getCurrencySymbol } from "@/shared/lib/utils";
import { escapeHtml } from "@/shared/lib/escape-html";
import { deskRideUrl } from "@/features/booking/lib/booking-mail-url";
import type { BookingEmailData } from "@/features/payments/lib/booking-email-data";

export async function sendNewAppointmentRequestAdminEmail(
  data: BookingEmailData
) {
  try {
    await connectDB();
    const settings = await Setting.findOne();
    const recipients = await resolveAdminNotificationEmails();
    if (!recipients.length) return false;

    const fromAddress =
      settings?.smtpFrom || settings?.smtpUser || "noreply@booking.com";
    const fromField = settings?.smtpSenderName
      ? `${settings.smtpSenderName} <${fromAddress}>`
      : fromAddress;
    const currency = settings?.stripeCurrency || "EUR";
    const currencySymbol = getCurrencySymbol(currency);
    const primaryColor = settings?.primaryColor || "#EAB308";
    const deskUrl = deskRideUrl(data.baseUrl, data.locale, data.bookingId);

    const html = `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#333">
  <div style="max-width:600px;margin:0 auto">
    <div style="border-left:4px solid ${primaryColor};padding:12px;background:#f5f5f5">
      <h1 style="margin:0;font-size:18px;color:${primaryColor}">New appointment request</h1>
    </div>
    <p><strong>#${escapeHtml(data.tripId)}</strong> — ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}</p>
    <p>${escapeHtml(data.pickup)} → ${escapeHtml(data.dropoff || "hourly")} · ${escapeHtml(data.date)} ${escapeHtml(data.time)}</p>
    <p>Indicative: ${currencySymbol}${Number(data.totalAmount).toFixed(2)}</p>
    ${deskUrl ? `<p><a href="${escapeHtml(deskUrl)}">Open in desk</a></p>` : ""}
  </div>
</body></html>`;

    return sendEmail({
      from: fromField,
      to: recipients,
      subject: `New appointment request #${data.tripId}`,
      html,
      text: `New appointment request #${data.tripId}`,
    });
  } catch (error) {
    console.error("sendNewAppointmentRequestAdminEmail:", error);
    return false;
  }
}
