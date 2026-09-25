import type { BookingPatchAction } from '@/features/booking/schema/booking-patch.schema';

export function bookingPatchSuccessMessage(action: BookingPatchAction): string {
  switch (action) {
    case 'cancel':
      return 'Booking canceled successfully';
    case 'approvepartner':
      return 'Booking approved for partners';
    case 'quote':
      return 'Pay link sent';
    case 'confirmcash':
      return 'Confirmed as cash';
    case 'decline':
      return 'Request declined';
    case 'assign':
    case 'assignpartner':
      return 'Assignment updated';
    default:
      return 'Booking completed successfully';
  }
}
