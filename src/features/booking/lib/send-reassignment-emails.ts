import { sendRideCancellationEmail } from '@/controllers/email/bookings';
import type { IBooking } from '@/models/booking';
import {
  bookingTotalOrZero,
  buildRideDispatchEmailPayload,
} from '@/lib/bookings/build-ride-dispatch-email';
import type { BookingPatchAction } from '@/lib/schemas/booking-patch.schema';

export async function sendReassignmentEmails(input: {
  action: BookingPatchAction;
  booking: IBooking;
  updatedBooking: IBooking;
  isReassignment: boolean;
  isPartnerReassignment: boolean;
}) {
  const { action, booking, updatedBooking } = input;

  if (
    action === 'assignpartner' &&
    input.isPartnerReassignment &&
    booking.assignedPartner
  ) {
    try {
      const emailSent = await sendRideCancellationEmail(
        buildRideDispatchEmailPayload(
          updatedBooking,
          booking.assignedPartner,
          bookingTotalOrZero(updatedBooking)
        )
      );

      if (!emailSent) {
        console.error(
          'Failed to send cancellation email to old partner:',
          booking.assignedPartner.email
        );
      }
    } catch (emailError) {
      console.error(
        'Error sending cancellation email to old partner:',
        emailError
      );
    }
  }

  if (action === 'assign' && input.isReassignment && booking.assignedDriver) {
    try {
      const emailSent = await sendRideCancellationEmail(
        buildRideDispatchEmailPayload(
          updatedBooking,
          booking.assignedDriver,
          bookingTotalOrZero(updatedBooking)
        )
      );

      if (!emailSent) {
        console.error(
          'Failed to send cancellation email to old driver:',
          booking.assignedDriver.email
        );
      }
    } catch (emailError) {
      console.error(
        'Error sending cancellation email to old driver:',
        emailError
      );
    }
  }
}
