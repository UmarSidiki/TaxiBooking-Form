import { sendOrderCancellationEmail } from '@/controllers/email/bookings';
import type { IBooking } from '@/models/booking';
import { createCancellationEmailData } from '@/lib/bookings/build-cancellation-email-data';
import type { BookingPatchAction } from '@/lib/schemas/booking-patch.schema';

export async function sendCancelCustomerEmail(
  action: BookingPatchAction,
  updatedBooking: IBooking,
  updateData: Partial<IBooking>
) {
  if (action !== 'cancel' || !updatedBooking.email) {
    return;
  }

  try {
    const cancellationPayload = createCancellationEmailData(
      updatedBooking,
      updateData
    );
    const emailSent = await sendOrderCancellationEmail(cancellationPayload);

    if (!emailSent) {
      console.error(
        'Failed to send cancellation email to:',
        updatedBooking.email
      );
    }
  } catch (emailError) {
    console.error('Error sending cancellation email:', emailError);
  }
}
