import { sendEmail } from "@/features/settings/lib/email";
import { connectDB } from "@/shared/db";
import { Setting } from "@/features/settings/model";
import { getCurrencySymbol } from "@/shared/lib/utils";
import {
  emailAction,
  emailDetails,
  emailParagraph,
  emailShell,
  type EmailDetail,
} from "@/features/booking/email/email-layout";
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

    const rows: EmailDetail[] = [
      ["Reference", `#${data.tripId}`],
      ["Pickup", data.pickup],
      [
        data.bookingType === "hourly" ? "Duration" : "Drop-off",
        data.bookingType === "hourly"
          ? `${data.duration ?? "-"} hours`
          : (data.dropoff ?? ""),
      ],
      ["Date and time", `${data.date} at ${data.time}`],
      ["Vehicle", data.vehicleDetails.name],
      ["Total", `${currencySymbol}${amount}`],
    ];

    const html = emailShell({
      heading: "We can take your trip",
      primaryColor,
      intro: `${currencySymbol}${amount} for this transfer. Pay to confirm the booking.`,
      sections: [
        emailDetails(rows),
        emailAction(data.payUrl, `Pay ${currencySymbol}${amount}`, primaryColor),
        emailParagraph(
          "Your booking is confirmed once the payment has gone through. This link stops working after that."
        ),
      ],
      supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
    });

    return sendEmail({
      from: fromField,
      to: data.email,
      subject: `Pay to confirm booking #${data.tripId}`,
      html,
      text: `We can take your trip\n\nReference: #${data.tripId}\nPickup: ${
        data.pickup
      }\n${
        data.bookingType === "hourly"
          ? `Duration: ${data.duration ?? "-"} hours`
          : `Drop-off: ${data.dropoff}`
      }\nDate and time: ${data.date} at ${data.time}\nVehicle: ${
        data.vehicleDetails.name
      }\nTotal: ${currencySymbol}${amount}\n\nPay here: ${
        data.payUrl
      }\n\nYour booking is confirmed once the payment has gone through.`,
    });
  } catch (error) {
    console.error("sendQuoteEmail:", error);
    return false;
  }
}
