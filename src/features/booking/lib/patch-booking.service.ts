import { connectDB } from '@/shared/db';
import { notifyEligiblePartners } from '@/features/partners/lib/notify-eligible-partners';
import { applyBookingPatch } from '@/features/booking/lib/apply-booking-patch';
import {
  findBookingById,
  updateBookingById,
} from '@/features/booking/lib/booking.repo';
import { creditPartnerOnComplete } from '@/features/booking/lib/credit-partner-on-complete';
import { sendAssignmentEmails } from '@/features/booking/lib/send-assignment-emails';
import { sendCancelCustomerEmail } from '@/features/booking/lib/send-cancel-customer-email';
import { sendReassignmentEmails } from '@/features/booking/lib/send-reassignment-emails';
import {
  parseBookingPatchBody,
  type BookingPatchAction,
} from '@/features/booking/schema/booking-patch.schema';
import type { IBooking } from '@/features/booking/model';

export type PatchBookingResult =
  | { ok: true; booking: IBooking; action: BookingPatchAction }
  | { ok: false; status: number; message: string };

export async function patchBooking(
  id: string,
  body: unknown,
  baseUrl?: string
): Promise<PatchBookingResult> {
  await connectDB();

  const parsed = parseBookingPatchBody(body);
  if (!parsed.success) {
    return { ok: false, status: parsed.status, message: parsed.error };
  }

  const booking = await findBookingById(id);
  if (!booking) {
    return { ok: false, status: 404, message: 'Booking not found' };
  }

  const isReassignment =
    parsed.data.action === 'assign' &&
    Boolean(booking.assignedDriver) &&
    booking.assignedDriver?._id !== parsed.data.driverId;
  const isPartnerReassignment =
    parsed.data.action === 'assignpartner' &&
    Boolean(booking.assignedPartner) &&
    booking.assignedPartner?._id !== parsed.data.partnerId;

  const applied = await applyBookingPatch(booking, id, parsed.data);
  if (!applied.ok) {
    return applied;
  }

  console.log('PATCH booking - Updating booking with data:', applied.updateData);
  const updatedBooking = await updateBookingById(id, applied.updateData);

  if (!updatedBooking) {
    console.log('PATCH booking - Failed to update booking');
    return { ok: false, status: 500, message: 'Failed to update booking' };
  }

  console.log(
    'PATCH booking - Booking updated successfully. New status:',
    updatedBooking.status
  );

  await sendCancelCustomerEmail(
    parsed.data.action,
    updatedBooking,
    applied.updateData
  );
  await sendReassignmentEmails({
    action: parsed.data.action,
    booking,
    updatedBooking,
    isReassignment,
    isPartnerReassignment,
  });
  await sendAssignmentEmails({
    action: parsed.data.action,
    updatedBooking,
    bookingId: id,
  });

  if (parsed.data.action === 'approvepartner') {
    const bookingForNotification = await findBookingById(
      String(updatedBooking._id)
    );
    if (bookingForNotification) {
      await notifyEligiblePartners(bookingForNotification, baseUrl);
    }
  }

  await creditPartnerOnComplete({
    action: parsed.data.action,
    previousStatus: booking.status,
    updatedBooking,
    bookingId: id,
  });

  return { ok: true, booking: updatedBooking, action: parsed.data.action };
}
