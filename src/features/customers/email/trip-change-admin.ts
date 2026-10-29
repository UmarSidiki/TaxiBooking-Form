import { sendEmail } from "@/features/settings/lib/email";
import { resolveAdminNotificationEmails } from "@/features/settings/lib/resolve-admin-emails";
import { Setting } from "@/features/settings/model";
import { connectDB } from "@/shared/db";
import type { IBooking } from "@/features/booking/model";

/** Operators are told about customer-initiated cancellations and changes. */
export async function sendTripChangeAdminEmail(
  booking: IBooking,
  kind: "cancel" | "change"
) {
  await connectDB();
  const [recipients, settings] = await Promise.all([
    resolveAdminNotificationEmails(),
    Setting.findOne(),
  ]);
  if (recipients.length === 0) return;

  const fromAddress = settings?.smtpFrom || settings?.smtpUser || "noreply@booking.com";
  const from = settings?.smtpSenderName
    ? `${settings.smtpSenderName} <${fromAddress}>`
    : fromAddress;
  const action = kind === "cancel" ? "cancelled" : "changed";
  const subject = `Ride ${action} by customer - #${booking.tripId}`;
  const text = [
    `Ride #${booking.tripId} was ${action} by the customer.`,
    `Customer: ${booking.firstName} ${booking.lastName} (${booking.email} / ${booking.phone})`,
    `From: ${booking.pickup}`,
    `To: ${booking.dropoff || "N/A (Hourly booking)"}`,
    `Departure: ${booking.date} at ${booking.time}`,
    `Total: ${booking.totalAmount ?? 0}`,
  ].join("\n");

  await Promise.all(
    recipients.map((to) =>
      sendEmail({ from, to, subject, text }).catch(() => false)
    )
  );
}
