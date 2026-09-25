import { sendEmail } from "@/features/settings/lib/email";
import { connectDB } from "@/shared/db";
import { Setting } from "@/features/settings/model";
import { getCurrencySymbol } from "@/shared/lib/utils";
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
      ["Indicative rate", `${currencySymbol}${amount}`],
    ];

    const html = emailShell({
      heading: "Appointment request received",
      primaryColor: settings?.primaryColor || "#EAB308",
      intro: "We have your request. This is not a confirmed booking yet.",
      sections: [
        emailDetails(rows),
        emailParagraph(
          "We work strictly by appointment. We will check availability and reply with the confirmed price and a payment link."
        ),
      ],
      supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
    });

    return sendEmail({
      from: fromField,
      to: data.email,
      subject: `Request received #${data.tripId}`,
      html,
      text: `Appointment request received\n\nReference: #${data.tripId}\nPickup: ${data.pickup}\n${
        data.bookingType === "hourly"
          ? `Duration: ${data.duration ?? "-"} hours`
          : `Drop-off: ${data.dropoff}`
      }\nDate and time: ${data.date} at ${data.time}\nVehicle: ${
        data.vehicleDetails.name
      }\nIndicative rate: ${currencySymbol}${amount}\n\nThis is not a confirmed booking. We will check availability and reply with the confirmed price and a payment link.`,
    });
  } catch (error) {
    console.error("sendRequestReceivedEmail:", error);
    return false;
  }
}
