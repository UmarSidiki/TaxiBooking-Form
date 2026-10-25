import type { IBooking } from "@/features/booking/model";
import { creditPartnerShare } from "@/features/booking/lib/credit-partner-on-complete";

/** Idempotent. Credits a partner only once the ride is completed and the payment has cleared. */
export async function creditPartnerAfterPayment(booking: IBooking) {
  if (!booking._id) return;
  await creditPartnerShare(booking, String(booking._id));
}
