import { sendRideAssignmentEmail } from '@/features/rides/email/ride-assignment';
import type { IBooking } from '@/features/booking/model';
import { markAssignmentEmailSent } from '@/features/booking/lib/booking.repo';
import {
  bookingTotalOrZero,
  buildRideDispatchEmailPayload,
  partnerPayoutOrTotal,
} from '@/features/booking/lib/build-ride-dispatch-email';
import type { BookingPatchAction } from '@/features/booking/schema/booking-patch.schema';

export async function sendAssignmentEmails(input: {
  action: BookingPatchAction;
  updatedBooking: IBooking;
  bookingId: string;
}) {
  const { action, updatedBooking, bookingId } = input;

  if (
    action === 'assignpartner' &&
    updatedBooking.assignedPartner &&
    !updatedBooking.assignmentEmailSent
  ) {
    try {
      const emailSent = await sendRideAssignmentEmail(
        buildRideDispatchEmailPayload(
          updatedBooking,
          updatedBooking.assignedPartner,
          partnerPayoutOrTotal(updatedBooking)
        )
      );

      if (emailSent) {
        await markAssignmentEmailSent(bookingId);
      } else {
        console.error(
          'Failed to send assignment email to:',
          updatedBooking.assignedPartner.email
        );
      }
    } catch (emailError) {
      console.error('Error sending assignment email:', emailError);
    }
  }

  if (
    action === 'assign' &&
    updatedBooking.assignedDriver &&
    !updatedBooking.assignmentEmailSent
  ) {
    try {
      const emailSent = await sendRideAssignmentEmail(
        buildRideDispatchEmailPayload(
          updatedBooking,
          updatedBooking.assignedDriver,
          bookingTotalOrZero(updatedBooking)
        )
      );

      if (emailSent) {
        await markAssignmentEmailSent(bookingId);
      } else {
        console.error(
          'Failed to send assignment email to:',
          updatedBooking.assignedDriver.email
        );
      }
    } catch (emailError) {
      console.error('Error sending assignment email:', emailError);
    }
  }
}
