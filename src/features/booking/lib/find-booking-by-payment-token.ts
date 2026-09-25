import { Booking, type IBooking } from "@/features/booking/model";
import { hashPaymentToken } from "@/features/booking/lib/payment-token";

export async function findBookingByPaymentToken(
  token: string
): Promise<IBooking | null> {
  if (!token || token.length < 32) return null;
  const hash = hashPaymentToken(token);
  return Booking.findOne({ paymentTokenHash: hash });
}
