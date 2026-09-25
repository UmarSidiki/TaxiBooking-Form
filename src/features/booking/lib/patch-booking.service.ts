import { connectDB } from '@/shared/db';
import { notifyEligiblePartners } from '@/features/partners/lib/notify-eligible-partners';
import { applyBookingPatch } from '@/features/booking/lib/apply-booking-patch';
import {
  findBookingById,
  updateBookingById,
} from '@/features/booking/lib/booking.repo';
import { creditPartnerOnComplete } from '@/features/booking/lib/credit-partner-on-complete';
import { clawbackPartnerSettlementsForBooking } from '@/features/partners/lib/clawback-partner-settlements';
import { sendAssignmentEmails } from '@/features/booking/lib/send-assignment-emails';
import { sendCancelCustomerEmail } from '@/features/booking/lib/send-cancel-customer-email';
import { sendReassignmentEmails } from '@/features/booking/lib/send-reassignment-emails';
import { sendAppointmentPatchEmails } from '@/features/booking/lib/send-appointment-patch-emails';
import { absoluteHttpBase } from '@/features/booking/lib/booking-mail-url';
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

  if (parsed.data.action === 'quote' && !absoluteHttpBase(baseUrl)) {
    return {
      ok: false,
      status: 400,
      message:
        'Cannot send pay link: set NEXT_PUBLIC_BASE_URL or open the desk from a public URL',
    };
  }

  const booking = await findBookingById(id);
  if (!booking) {
    return { ok: false, status: 404, message: 'Booking not found' };
  }

  const isReassignment =
    parsed.data.action === 'assign' &&
    Boolean(booking.assignedDriver) &&
    String(booking.assignedDriver?._id) !== String(parsed.data.driverId);
  const isPartnerReassignment =
    parsed.data.action === 'assignpartner' &&
    Boolean(booking.assignedPartner) &&
    String(booking.assignedPartner?._id) !== String(parsed.data.partnerId);

  if (
    parsed.data.action === 'complete' &&
    booking.assignedPartner?._id &&
    typeof booking.partnerPayoutAmount !== 'number'
  ) {
    return {
      ok: false,
      status: 400,
      message:
        'Partner share is missing. Approve the ride for partners before completing.',
    };
  }

  const applied = await applyBookingPatch(booking, id, parsed.data);
  if (!applied.ok) {
    return applied;
  }

  const updatedBooking = await updateBookingById(
    id,
    applied.updateData,
    applied.unsetFields
  );

  if (!updatedBooking) {
    return { ok: false, status: 500, message: 'Failed to update booking' };
  }

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

  const emailResult = await sendAppointmentPatchEmails({
    action: parsed.data.action,
    booking: updatedBooking,
    paymentToken: applied.paymentToken,
    baseUrl,
  });
  if (!emailResult.ok) {
    return { ok: false, status: 502, message: emailResult.message };
  }

  if (parsed.data.action === 'approvepartner') {
    const shouldNotify = parsed.data.notifyPartners !== false;
    if (shouldNotify) {
      const bookingForNotification = await findBookingById(
        String(updatedBooking._id)
      );
      if (bookingForNotification) {
        await notifyEligiblePartners(bookingForNotification, baseUrl);
      }
    }
  }

  const creditResult = await creditPartnerOnComplete({
    action: parsed.data.action,
    previousStatus: booking.status,
    updatedBooking,
    bookingId: id,
  });
  if (!creditResult.ok) {
    return { ok: false, status: 400, message: creditResult.message };
  }

  if (
    parsed.data.action === 'cancel' &&
    booking.status === 'completed' &&
    booking.assignedPartner?._id
  ) {
    await clawbackPartnerSettlementsForBooking(booking);
  }

  return { ok: true, booking: updatedBooking, action: parsed.data.action };
}
