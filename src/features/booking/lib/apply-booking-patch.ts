import type { IBooking } from '@/features/booking/model';
import type { BookingPatchBody } from '@/features/booking/schema/booking-patch.schema';
import { applyApprovePartner } from '@/features/booking/lib/apply-approve-partner';
import { applyEditBooking } from '@/features/booking/lib/apply-edit-booking';
import { applyAssignDriver } from '@/features/booking/lib/apply-assign-driver';
import { findAssigneeConflict } from '@/features/calendar/lib/find-assignee-conflict';
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
    const assigned = await applyAssignDriver(
      patch.driverId,
      updateData,
      String(booking.selectedVehicle ?? ""),
      booking,
    );
    if (!assigned.ok || !patch.driverId) return assigned;
    const conflict = await findAssigneeConflict({
      field: "assignedDriver._id",
      assigneeId: patch.driverId,
      booking,
    });
    return conflict ? { ...assigned, warn: conflict } : assigned;
  }

  if (patch.action === 'assignpartner') {
    if (booking.status === 'requested' || booking.status === 'awaiting_payment') {
      return {
        ok: false,
        status: 400,
        message: 'Confirm the appointment request before assigning',
      };
    }
    const assignedPartner = await applyAssignPartner(booking, bookingId, patch.partnerId, updateData);
    if (!assignedPartner.ok || !patch.partnerId) return assignedPartner;
    const conflict = await findAssigneeConflict({
      field: "assignedPartner._id",
      assigneeId: patch.partnerId,
      booking,
    });
    return conflict ? { ...assignedPartner, warn: conflict } : assignedPartner;
  }

  if (patch.action === 'edit') {
    return applyEditBooking(booking, patch.edit, updateData);
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
