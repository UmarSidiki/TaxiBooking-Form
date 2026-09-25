import { sendEmail } from "@/features/settings/lib/email";
import { connectDB } from "@/shared/db";
import { Setting } from "@/features/settings/model";
import { getCurrencySymbol } from "@/shared/lib/utils";
import { escapeHtml } from "@/shared/lib/escape-html";
import type { BookingEmailData } from "@/features/payments/lib/booking-email-data";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function sendQuoteEmail(
  data: BookingEmailData & { payUrl: string }
) {
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
    const amount = Number(data.totalAmount).toFixed(2);

    const html = `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#333">
  <div style="max-width:600px;margin:0 auto">
    <div style="border-left:4px solid ${primaryColor};padding:12px;background:#f5f5f5">
      <h1 style="margin:0;font-size:18px;color:${primaryColor}">Availability confirmed</h1>
    </div>
    <p>Hi ${escapeHtml(data.firstName)},</p>
    <p>We can take your trip <strong>#${escapeHtml(data.tripId)}</strong>.</p>
    <p><strong>Price:</strong> ${currencySymbol}${amount}</p>
    <p style="text-align:center;margin:24px 0">
      <a href="${escapeHtml(data.payUrl)}" style="background:${primaryColor};color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold">
        Pay to confirm
      </a>
    </p>
    <p>Your appointment is confirmed only after payment.</p>
  </div>
</body></html>`;

    return sendEmail({
      from: fromField,
      to: data.email,
      subject: `Availability confirmed — pay to confirm #${data.tripId}`,
      html,
      text: `Availability confirmed for #${data.tripId}. Price ${currencySymbol}${amount}. Pay: ${data.payUrl}`,
    });
  } catch (error) {
    console.error("sendQuoteEmail:", error);
    return false;
  }
}
