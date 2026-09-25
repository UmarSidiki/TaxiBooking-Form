import { sendEmail } from "@/features/settings/lib/email";
import { connectDB } from "@/shared/db";
import { Setting } from "@/features/settings/model";
import { escapeHtml } from "@/shared/lib/escape-html";
import type { BookingEmailData } from "@/features/payments/lib/booking-email-data";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function sendRequestDeclinedEmail(
  data: BookingEmailData & { declineReason?: string }
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
    const primaryColor = settings?.primaryColor || "#EAB308";
    const reason = data.declineReason?.trim();

    const html = `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#333">
  <div style="max-width:600px;margin:0 auto">
    <div style="border-left:4px solid ${primaryColor};padding:12px;background:#f5f5f5">
      <h1 style="margin:0;font-size:18px;color:${primaryColor}">Not available</h1>
    </div>
    <p>Hi ${escapeHtml(data.firstName)},</p>
    <p>We cannot take appointment request <strong>#${escapeHtml(data.tripId)}</strong> for that slot.</p>
    ${reason ? `<p>${escapeHtml(reason)}</p>` : ""}
    <p>You can submit another request for a different time.</p>
  </div>
</body></html>`;

    return sendEmail({
      from: fromField,
      to: data.email,
      subject: `Not available — #${data.tripId}`,
      html,
      text: `Not available for #${data.tripId}.${reason ? ` ${reason}` : ""}`,
    });
  } catch (error) {
    console.error("sendRequestDeclinedEmail:", error);
    return false;
  }
}
