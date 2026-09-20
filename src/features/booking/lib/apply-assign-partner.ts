import { Partner } from '@/features/partners/model';
import type { IBooking } from '@/features/booking/model';
import type { BookingPatchApplyResult } from '@/features/booking/lib/booking-patch-result';

export async function applyAssignPartner(
  booking: IBooking,
  bookingId: string,
  partnerId: unknown,
  updateData: Partial<IBooking>
): Promise<BookingPatchApplyResult> {
  if (!partnerId) {
    return {
      ok: false,
      status: 400,
      message: 'Partner ID is required for assignment',
    };
  }

  const partner = await Partner.findById(partnerId);
  if (!partner) {
    return { ok: false, status: 404, message: 'Partner not found' };
  }

  if (partner.status !== 'approved') {
    return {
      ok: false,
      status: 400,
      message: 'Partner must be approved to receive assignments',
    };
  }

  if (
    booking.paymentMethod !== 'cash' &&
    booking.partnerReviewStatus !== 'approved'
  ) {
    console.log('Partner review not approved for booking:', bookingId);
    return {
      ok: false,
      status: 400,
      message:
        'Booking must be approved for partners before assignment. Please approve first or try again.',
    };
  }

  updateData.assignedPartner = {
    _id: partner._id.toString(),
    name: partner.name,
    email: partner.email,
  };
  updateData.assignmentEmailSent = false;

  return { ok: true, updateData };
}
