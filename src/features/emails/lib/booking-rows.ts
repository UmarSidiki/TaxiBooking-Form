import type { BookingEmailData } from "@/features/payments/lib/booking-email-data";
import type {
  EmailPriceRow,
  EmailTranslator,
  EmailTrip,
} from "@/features/emails/types";

export function isHourlyBooking(data: BookingEmailData) {
  return (
    data.bookingType === "hourly" ||
    data.dropoff === "N/A (Hourly booking)"
  );
}

export function bookingTrip(data: BookingEmailData): EmailTrip {
  return {
    tripId: data.tripId,
    pickup: data.pickup,
    dropoff: isHourlyBooking(data) ? null : data.dropoff,
    stops: data.stops ?? [],
    date: data.date,
    time: data.time,
    returnDate: data.tripType === "roundtrip" ? data.returnDate : null,
    returnTime: data.tripType === "roundtrip" ? data.returnTime : null,
    vehicle: data.vehicleDetails?.name || data.selectedVehicle,
    passengers: data.passengers,
    childSeats: data.childSeats,
    babySeats: data.babySeats,
    flightNumber: data.flightNumber,
    duration: data.duration,
    bookingType: data.bookingType,
  };
}

export function bookingPriceRows(
  data: BookingEmailData,
  symbol: string,
  t: EmailTranslator,
): EmailPriceRow[] {
  const rows: EmailPriceRow[] = [];
  const hasTax = !!data.taxAmount && data.taxAmount > 0;
  if (hasTax && !data.taxIncluded) {
    const subtotal = data.subtotalAmount ?? data.totalAmount;
    rows.push({
      label: t("subtotal"),
      value: `${symbol}${Number(subtotal).toFixed(2)}`,
    });
    rows.push({
      label: t("tax", { percent: data.taxPercentage ?? 0 }),
      value: `${symbol}${Number(data.taxAmount).toFixed(2)}`,
    });
  }
  rows.push({
    label: t("total"),
    value: `${symbol}${Number(data.totalAmount).toFixed(2)}`,
  });
  if (hasTax && data.taxIncluded) {
    rows.push({
      label: t("tax_included", { percent: data.taxPercentage ?? 0 }),
      value: `${symbol}${Number(data.taxAmount).toFixed(2)}`,
    });
  }
  if (data.paymentMethod) {
    rows.push({
      label: t("payment_method"),
      value: data.paymentMethod.replaceAll("_", " "),
    });
  }
  if (data.paymentStatus) {
    const raw = String(data.paymentStatus).toLowerCase().trim();
    const key =
      raw === "completed" || raw === "paid"
        ? "status_paid"
        : raw === "pending"
          ? "status_pending"
          : raw === "refunded"
            ? "status_refunded"
            : raw === "cash" ||
                raw === "pay_on_pickup" ||
                raw === "pay-on-pickup" ||
                raw === "pickup"
              ? "status_pay_on_pickup"
              : null;
    rows.push({
      label: t("payment_status"),
      value: key ? t(key) : data.paymentStatus,
    });
  }
  return rows;
}
