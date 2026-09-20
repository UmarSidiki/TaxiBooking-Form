import { sendOrderCancellationEmail } from '@/features/booking/email/order-cancellation';
import type { IBooking } from '@/features/booking/model';
import { createCancellationEmailData } from '@/features/booking/lib/build-cancellation-email-data';
import type { BookingPatchAction } from '@/features/booking/schema/booking-patch.schema';

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
