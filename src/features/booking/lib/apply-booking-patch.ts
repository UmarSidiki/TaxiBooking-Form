import type { IBooking } from '@/features/booking/model';
import type { BookingPatchBody } from '@/features/booking/schema/booking-patch.schema';
import { applyApprovePartner } from '@/features/booking/lib/apply-approve-partner';
import { applyAssignDriver } from '@/features/booking/lib/apply-assign-driver';
import { applyAssignPartner } from '@/features/booking/lib/apply-assign-partner';
import { applyCancelBooking } from '@/features/booking/lib/apply-cancel-booking';
import { applyConfirmCashBooking } from '@/features/booking/lib/apply-confirm-cash-booking';
import { applyDeclineRequest } from '@/features/booking/lib/apply-decline-request';
import { applyQuoteBooking } from '@/features/booking/lib/apply-quote-booking';
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
    if (booking.status === 'requested' || booking.status === 'awaiting_payment') {
      return {
        ok: false,
        status: 400,
        message: 'Confirm the appointment request before completing',
      };
    }
    updateData.status = 'completed';
    return { ok: true, updateData };
  }

  if (patch.action === 'assign') {
    if (booking.status === 'requested' || booking.status === 'awaiting_payment') {
      return {
        ok: false,
        status: 400,
        message: 'Confirm the appointment request before assigning',
      };
    }
    return applyAssignDriver(patch.driverId, updateData);
  }

  if (patch.action === 'assignpartner') {
    if (booking.status === 'requested' || booking.status === 'awaiting_payment') {
      return {
        ok: false,
        status: 400,
        message: 'Confirm the appointment request before assigning',
      };
    }
    return applyAssignPartner(booking, bookingId, patch.partnerId, updateData);
  }

  if (patch.action === 'quote') {
    return applyQuoteBooking(booking, patch.quotedAmount, updateData);
  }

  if (patch.action === 'confirmcash') {
    return applyConfirmCashBooking(booking, updateData);
  }

  if (patch.action === 'decline') {
    return applyDeclineRequest(booking, patch.declineReason, updateData);
  }

  return applyApprovePartner(booking, patch.marginPercentage, updateData);
}
