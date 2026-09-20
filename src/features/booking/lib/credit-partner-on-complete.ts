import { Partner } from '@/models/partner';
import type { IBooking } from '@/models/booking';
import type { BookingPatchAction } from '@/lib/schemas/booking-patch.schema';

export async function creditPartnerOnComplete(input: {
  action: BookingPatchAction;
  previousStatus: IBooking['status'];
  updatedBooking: IBooking;
  bookingId: string;
}) {
  const { action, previousStatus, updatedBooking, bookingId } = input;

  if (
    action === 'complete' &&
    previousStatus !== 'completed' &&
    updatedBooking.assignedPartner?._id
  ) {
    console.log('PATCH booking - Partner earnings update triggered', {
      bookingId,
      partnerId: updatedBooking.assignedPartner._id,
      bookingStatus: previousStatus,
    });

    const partnerAmount =
      typeof updatedBooking.partnerPayoutAmount === 'number'
        ? updatedBooking.partnerPayoutAmount
        : typeof updatedBooking.totalAmount === 'number'
          ? updatedBooking.totalAmount
          : 0;

    const isCashBooking = updatedBooking.paymentMethod === 'cash';
    const isPaymentComplete =
      isCashBooking || updatedBooking.paymentStatus === 'completed';

    console.log('PATCH booking - Partner earnings details', {
      partnerAmount,
      isCashBooking,
      paymentStatus: updatedBooking.paymentStatus,
      isPaymentComplete,
    });

    if (partnerAmount > 0 && isPaymentComplete) {
      const incPayload: Record<string, number> = {
        totalEarnings: partnerAmount,
      };

      if (isCashBooking) {
        incPayload.cashEarnings = partnerAmount;
      } else {
        incPayload.onlineEarnings = partnerAmount;
        incPayload.payoutBalance = partnerAmount;
      }

      console.log('PATCH booking - Incrementing partner with payload:', incPayload);

      try {
        const updatedPartner = await Partner.findByIdAndUpdate(
          updatedBooking.assignedPartner._id,
          { $inc: incPayload },
          { returnDocument: 'after' }
        );
        console.log('PATCH booking - Partner earnings updated successfully', {
          partnerId: updatedBooking.assignedPartner._id,
          payoutBalance: updatedPartner?.payoutBalance,
          onlineEarnings: updatedPartner?.onlineEarnings,
          cashEarnings: updatedPartner?.cashEarnings,
        });
      } catch (partnerUpdateError) {
        console.error('PATCH booking - Failed to update partner earnings', {
          error: partnerUpdateError,
          partnerId: updatedBooking.assignedPartner._id,
        });
      }
    } else {
      console.log('PATCH booking - Skipping partner update - conditions not met', {
        partnerAmount,
        isPaymentComplete,
        hasPartner: !!updatedBooking.assignedPartner?._id,
      });
    }
    return;
  }

  if (action === 'complete') {
    console.log('PATCH booking - Complete action but partner earnings not updated', {
      bookingAlreadyCompleted: previousStatus === 'completed',
      hasPartner: !!updatedBooking.assignedPartner?._id,
      bookingStatus: previousStatus,
    });
  }
}
