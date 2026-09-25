import { sendEmail } from "@/features/settings/lib/email";
import { resolveAdminNotificationEmails } from "@/features/settings/lib/resolve-admin-emails";
import { connectDB } from "@/shared/db";
import { Setting } from "@/features/settings/model";
import { getCurrencySymbol } from "@/shared/lib/utils";
import { deskRideUrl } from "@/features/booking/lib/booking-mail-url";
import {
  emailAction,
  emailDetails,
  emailSubheading,
  emailShell,
  type EmailDetail,
} from "@/features/booking/email/email-layout";
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
    const amount = Number(data.totalAmount).toFixed(2);

    const customerRows: EmailDetail[] = [
      ["Name", `${data.firstName} ${data.lastName}`],
      ["Email", data.email],
      ["Phone", data.phone],
    ];

    const tripRows: EmailDetail[] = [
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
      heading: "New appointment request",
      primaryColor,
      intro: `${data.firstName} ${data.lastName} is asking for availability. Quote it, confirm it as cash, or decline it in the desk.`,
      sections: [
        emailSubheading("Customer"),
        emailDetails(customerRows),
        emailSubheading("Trip"),
        emailDetails(tripRows),
        emailAction(deskUrl ?? "", "Open in the desk", primaryColor),
      ],
      supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
    });

    return sendEmail({
      from: fromField,
      to: recipients,
      subject: `New appointment request #${data.tripId}`,
      html,
      text: `New appointment request #${data.tripId}\n\nCustomer: ${
        data.firstName
      } ${data.lastName}\nEmail: ${data.email}\nPhone: ${data.phone}\n\nPickup: ${
        data.pickup
      }\n${
        data.bookingType === "hourly"
          ? `Duration: ${data.duration ?? "-"} hours`
          : `Drop-off: ${data.dropoff}`
      }\nDate and time: ${data.date} at ${data.time}\nVehicle: ${
        data.vehicleDetails.name
      }\nIndicative rate: ${currencySymbol}${amount}${
        deskUrl ? `\n\nOpen in the desk: ${deskUrl}` : ""
      }`,
    });
  } catch (error) {
    console.error("sendNewAppointmentRequestAdminEmail:", error);
    return false;
  }
}
