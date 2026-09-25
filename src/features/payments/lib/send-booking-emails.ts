import { sendOrderConfirmationEmail } from '@/features/booking/email/order-confirmation';
import { sendOrderNotificationEmail } from '@/features/booking/email/order-notification';
import { connectDB } from '@/shared/db';
import { Booking } from '@/features/booking/model';
import { sendBookingWhatsApp } from '@/features/settings/lib/send-booking-whatsapp';
import type { BookingEmailData } from './booking-email-data';

export interface BookingEmailResult {
  confirmationSent: boolean;
  adminSent: boolean;
}

type EmailFlag = 'confirmationEmailSent' | 'adminNotificationSent';

/**
 * Claims the flag *before* sending. Two concurrent finalize calls (the Stripe
 * webhook and the success-page fallback fire within a second of each other) both
 * used to read the flag as false and both send, which is why customers got the
 * confirmation twice.
 */
async function claimEmailSend(bookingId: string, field: EmailFlag): Promise<boolean> {
  const claimed = await Booking.findOneAndUpdate(
    { _id: bookingId, [field]: { $ne: true } },
    { $set: { [field]: true } },
    { returnDocument: 'after' }
  );
  return Boolean(claimed);
}

/** Hands the claim back when the send failed, so a retry can still deliver. */
async function releaseEmailSend(bookingId: string, field: EmailFlag): Promise<void> {
  await Booking.updateOne({ _id: bookingId }, { $set: { [field]: false } });
}

/**
 * Sends customer + admin emails at most once per booking, using an atomic claim
 * on the booking flags so concurrent callers cannot double-send.
 */
export async function sendBookingEmails(
  emailData: BookingEmailData,
  bookingId: string
): Promise<BookingEmailResult> {
  await connectDB();

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return { confirmationSent: false, adminSent: false };
  }

  const whatsapp = sendBookingWhatsApp(bookingId);

  let confirmationSent = Boolean(booking.confirmationEmailSent);
  let adminSent = Boolean(booking.adminNotificationSent);

  try {
    if (!confirmationSent && (await claimEmailSend(bookingId, 'confirmationEmailSent'))) {
      confirmationSent = await sendOrderConfirmationEmail(emailData);
      if (!confirmationSent) {
        await releaseEmailSend(bookingId, 'confirmationEmailSent');
      }
    }

    if (!adminSent && (await claimEmailSend(bookingId, 'adminNotificationSent'))) {
      adminSent = await sendOrderNotificationEmail(emailData);
      if (!adminSent) {
        await releaseEmailSend(bookingId, 'adminNotificationSent');
      }
    }

    return { confirmationSent, adminSent };
  } finally {
    await whatsapp;
  }
}
