import type { IBooking } from '@/features/booking/model';
import type { BookingPatchBody } from '@/features/booking/schema/booking-patch.schema';
import { applyApprovePartner } from '@/features/booking/lib/apply-approve-partner';
import { applyAssignDriver } from '@/features/booking/lib/apply-assign-driver';
import { applyAssignPartner } from '@/features/booking/lib/apply-assign-partner';
import { applyCancelBooking } from '@/features/booking/lib/apply-cancel-booking';
import type { BookingPatchApplyResult } from '@/features/booking/lib/booking-patch-result';

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
