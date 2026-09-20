import type { BookingPatchAction } from '@/lib/schemas/booking-patch.schema';

export function bookingPatchSuccessMessage(action: BookingPatchAction): string {
  const actionPastTense =
    action === 'cancel'
      ? 'canceled'
      : action === 'approvepartner'
        ? 'approved for partners'
        : 'completed';

  return `Booking ${actionPastTense} successfully`;
}
