import { sendEmail } from "@/features/settings/lib/email";
import { connectDB } from "@/shared/db";
import { Setting } from "@/features/settings/model";
import {
  emailDetails,
  emailParagraph,
  emailShell,
  type EmailDetail,
} from "@/features/booking/email/email-layout";
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

    const rows: EmailDetail[] = [
      ["Reference", `#${data.tripId}`],
      [
        data.bookingType === "hourly" ? "Duration" : "Drop-off",
        data.bookingType === "hourly"
          ? `${data.duration ?? "-"} hours`
          : (data.dropoff ?? ""),
      ],
      ["Date and time", `${data.date} at ${data.time}`],
    ];

    const html = emailShell({
      heading: "We cannot take this request",
      primaryColor,
      intro: "We are not able to cover this trip at the time you asked for.",
      sections: [
        emailDetails(rows),
        ...(reason ? [emailParagraph(reason)] : []),
        emailParagraph(
          "You are welcome to send another request for a different time."
        ),
      ],
      supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
    });

    return sendEmail({
      from: fromField,
      to: data.email,
      subject: `Request #${data.tripId} not available`,
      html,
      text: `We cannot take this request\n\nReference: #${data.tripId}\n${
        data.bookingType === "hourly"
          ? `Duration: ${data.duration ?? "-"} hours`
          : `Drop-off: ${data.dropoff}`
      }\nDate and time: ${data.date} at ${data.time}${
        reason ? `\n\n${reason}` : ""
      }\n\nYou are welcome to send another request for a different time.`,
    });
  } catch (error) {
    console.error("sendRequestDeclinedEmail:", error);
    return false;
  }
}
