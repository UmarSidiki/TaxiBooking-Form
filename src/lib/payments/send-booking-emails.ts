import { sendOrderConfirmationEmail, sendOrderNotificationEmail } from '@/controllers/email/bookings';
import { connectDB } from '@/lib/database';
import { Booking } from '@/models/booking';
import type { BookingEmailData } from './booking-email-data';

export interface BookingEmailResult {
  confirmationSent: boolean;
  adminSent: boolean;
}

/**
 * Sends customer + admin emails idempotently using booking flags.
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

  let confirmationSent = Boolean(booking.confirmationEmailSent);
  let adminSent = Boolean(booking.adminNotificationSent);

  if (!booking.confirmationEmailSent) {
    confirmationSent = await sendOrderConfirmationEmail(emailData);
    if (confirmationSent) {
      await Booking.updateOne({ _id: bookingId }, { $set: { confirmationEmailSent: true } });
    }
  }

  if (!booking.adminNotificationSent) {
    adminSent = await sendOrderNotificationEmail(emailData);
    if (adminSent) {
      await Booking.updateOne({ _id: bookingId }, { $set: { adminNotificationSent: true } });
    }
  }

  return { confirmationSent, adminSent };
}
