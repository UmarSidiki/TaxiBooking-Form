import { sendEmail } from "@/features/settings/lib/email";
import { connectDB } from "@/shared/db";
import { Setting } from "@/features/settings/model";
import { getCurrencySymbol } from "@/shared/lib/utils";
import { escapeHtml } from "@/shared/lib/escape-html";
import type { BookingEmailData } from "@/features/payments/lib/booking-email-data";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function sendRequestReceivedEmail(data: BookingEmailData) {
  try {
    if (!data.email || !isValidEmail(data.email)) return false;

    await connectDB();
    const settings = await Setting.findOne();
    const fromAddress =
      settings?.smtpFrom || settings?.smtpUser || "noreply@booking.com";
    const fromField = settings?.smtpSenderName
      ? `${settings.smtpSenderName} <${fromAddress}>`
      : fromAddress;
    const currency = settings?.stripeCurrency || "EUR";
    const currencySymbol = getCurrencySymbol(currency);
    const primaryColor = settings?.primaryColor || "#EAB308";

    const html = `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#333">
  <div style="max-width:600px;margin:0 auto">
    <div style="border-left:4px solid ${primaryColor};padding:12px;background:#f5f5f5;margin-bottom:16px">
      <h1 style="margin:0;font-size:18px;color:${primaryColor}">Request received</h1>
      <p style="margin:8px 0 0">We work strictly by appointment. This is not a confirmation yet.</p>
    </div>
    <p>Hi ${escapeHtml(data.firstName)},</p>
    <p>We received your appointment request <strong>#${escapeHtml(data.tripId)}</strong>.</p>
    <p><strong>From:</strong> ${escapeHtml(data.pickup)}<br/>
    ${data.bookingType === "hourly" ? `<strong>Duration:</strong> ${escapeHtml(data.duration ?? "—")} hours` : `<strong>To:</strong> ${escapeHtml(data.dropoff)}`}<br/>
    <strong>When:</strong> ${escapeHtml(data.date)} at ${escapeHtml(data.time)}<br/>
    <strong>Indicative rate:</strong> ${currencySymbol}${Number(data.totalAmount).toFixed(2)}</p>
    <p>We will check availability and email you next steps.</p>
  </div>
</body></html>`;

    return sendEmail({
      from: fromField,
      to: data.email,
      subject: `Request received — #${data.tripId}`,
      html,
      text: `Request received for #${data.tripId}. Not confirmed yet. Indicative rate ${currencySymbol}${Number(data.totalAmount).toFixed(2)}.`,
    });
  } catch (error) {
    console.error("sendRequestReceivedEmail:", error);
    return false;
  }
}
