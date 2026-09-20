import type { IBooking } from '@/models/booking';
import type { BookingPatchBody } from '@/lib/schemas/booking-patch.schema';
import { applyApprovePartner } from '@/lib/bookings/apply-approve-partner';
import { applyAssignDriver } from '@/lib/bookings/apply-assign-driver';
import { applyAssignPartner } from '@/lib/bookings/apply-assign-partner';
import { applyCancelBooking } from '@/lib/bookings/apply-cancel-booking';
import type { BookingPatchApplyResult } from '@/lib/bookings/booking-patch-result';

export async function applyBookingPatch(
  booking: IBooking,
  bookingId: string,
  patch: BookingPatchBody
): Promise<BookingPatchApplyResult> {
  const updateData: Partial<IBooking> = {
    updatedAt: new Date(),
  };

  if (patch.action === 'cancel') {
    return applyCancelBooking(
      booking,
      bookingId,
      patch.refundPercentage,
      updateData
    );
  }

  if (patch.action === 'complete') {
    console.log('PATCH booking - Complete action for booking ID:', bookingId);
    updateData.status = 'completed';
    return { ok: true, updateData };
  }

  if (patch.action === 'assign') {
    return applyAssignDriver(patch.driverId, updateData);
  }

  if (patch.action === 'assignpartner') {
    return applyAssignPartner(booking, bookingId, patch.partnerId, updateData);
  }

  return applyApprovePartner(booking, patch.marginPercentage, updateData);
}
