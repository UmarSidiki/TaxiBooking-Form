import { Setting } from '@/models/settings';
import type { IBooking } from '@/models/booking';
import type { BookingPatchApplyResult } from '@/lib/bookings/booking-patch-result';

export async function applyApprovePartner(
  booking: IBooking,
  marginPercentage: unknown,
  updateData: Partial<IBooking>
): Promise<BookingPatchApplyResult> {
  if (!booking.totalAmount || Number.isNaN(Number(booking.totalAmount))) {
    return {
      ok: false,
      status: 400,
      message: 'Booking total amount is missing',
    };
  }

  const settings = await Setting.findOne();
  if (!settings?.enablePartners) {
    return {
      ok: false,
      status: 400,
      message: 'Partner marketplace is disabled',
    };
  }

  if (booking.paymentMethod === 'cash') {
    return {
      ok: false,
      status: 400,
      message: 'Cash bookings cannot be approved for partners',
    };
  }

  const submittedMargin =
    marginPercentage !== undefined ? Number(marginPercentage) : 0;

  if (Number.isNaN(submittedMargin) || submittedMargin < 0 || submittedMargin > 100) {
    return {
      ok: false,
      status: 400,
      message: 'Margin percentage must be between 0 and 100',
    };
  }

  const totalAmount =
    typeof booking.totalAmount === 'number'
      ? booking.totalAmount
      : Number(booking.totalAmount);
  const marginAmount = Number(((totalAmount * submittedMargin) / 100).toFixed(2));
  const partnerPayout = Number((totalAmount - marginAmount).toFixed(2));

  updateData.partnerMarginPercentage = submittedMargin;
  updateData.partnerMarginAmount = marginAmount;
  updateData.partnerPayoutAmount = partnerPayout;
  updateData.partnerReviewStatus = 'approved';
  updateData.partnerApprovedAt = new Date();
  updateData.availableForPartners = false;
  updateData.partnerNotificationSent = false;

  return { ok: true, updateData };
}
