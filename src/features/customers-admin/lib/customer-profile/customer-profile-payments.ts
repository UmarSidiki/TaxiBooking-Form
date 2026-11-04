import type { ProfileBookingDoc } from "@/features/customers-admin/lib/customer-profile/customer-profile.repo";
import type { ProfileChargeDoc } from "@/features/customers-admin/lib/customer-profile/customer-profile-signals.repo";
import type { CustomerPaymentRow } from "@/features/customers-admin/lib/customer-profile/customer-profile.types";
import { iso } from "@/features/customers-admin/lib/customer-profile/customer-profile-time";

export function toMinor(amount: number | null | undefined): number {
  return Math.round((amount ?? 0) * 100);
}

export function paidMinor(booking: ProfileBookingDoc): number {
  if (typeof booking.amountPaidCents === "number") return booking.amountPaidCents;
  const total = toMinor(booking.totalAmount);
  return booking.paymentStatus === "completed" ? total : 0;
}

export function refundedMinor(booking: ProfileBookingDoc): number {
  if (typeof booking.amountRefundedCents === "number") {
    return booking.amountRefundedCents;
  }
  return toMinor(booking.refundAmount);
}

export function bookingPayments(bookings: ProfileBookingDoc[]): CustomerPaymentRow[] {
  const rows: CustomerPaymentRow[] = [];
  for (const booking of bookings) {
    const at = iso(booking.createdAt);
    const paid = paidMinor(booking);
    if (paid > 0) {
      rows.push({
        id: `${String(booking._id)}:payment`,
        kind: "payment",
        tripId: booking.tripId,
        amountMinor: paid,
        status: booking.paymentStatus || "completed",
        method: booking.paymentMethod || "",
        at,
      });
    }
    const refunded = refundedMinor(booking);
    if (refunded > 0) {
      rows.push({
        id: `${String(booking._id)}:refund`,
        kind: "refund",
        tripId: booking.tripId,
        amountMinor: refunded,
        status: "refunded",
        method: booking.paymentMethod || "",
        at,
      });
    }
  }
  return rows;
}

export function chargePayments(charges: ProfileChargeDoc[]): CustomerPaymentRow[] {
  return charges.map((charge) => ({
    id: `charge:${charge.orderId}`,
    kind: "ride_charge" as const,
    tripId: charge.tripId,
    amountMinor: toMinor(charge.amount),
    status: charge.status || "pending",
    method: charge.provider,
    at: iso(charge.createdAt),
  }));
}
