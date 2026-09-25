import { getCurrencySymbol } from "@/shared/lib/utils";
import {
  emailAction,
  emailDetails,
  emailParagraph,
  emailShell,
  emailSubheading,
  type EmailDetail,
} from "@/features/booking/email/email-layout";
import type { BookingEmailData } from "@/features/payments/lib/booking-email-data";

function isHourly(booking: BookingEmailData) {
  return (
    booking.bookingType === "hourly" ||
    booking.dropoff === "N/A (Hourly booking)"
  );
}

function tripRows(booking: BookingEmailData): EmailDetail[] {
  const stopDetails: EmailDetail[] = (booking.stops ?? []).map(
    (stop, index) => [
      `Stop ${index + 1}`,
      stop.duration && stop.duration > 0
        ? `${stop.location} (wait ${stop.duration} min)`
        : stop.location,
    ]
  );

  const rows: EmailDetail[] = [
    ["Reference", `#${booking.tripId}`],
    ["Pickup", booking.pickup],
    ...stopDetails,
  ];

  if (isHourly(booking)) {
    rows.push(["Duration", `${booking.duration ?? "-"} hours`]);
  } else {
    rows.push(["Drop-off", booking.dropoff]);
  }

  rows.push(["Date and time", `${booking.date} at ${booking.time}`]);

  if (booking.tripType === "roundtrip" && booking.returnDate) {
    rows.push([
      "Return",
      `${booking.returnDate} at ${booking.returnTime ?? ""}`.trim(),
    ]);
  }

  rows.push(["Vehicle", booking.vehicleDetails.name]);

  if (booking.vehicleDetails.seats) {
    rows.push(["Capacity", booking.vehicleDetails.seats]);
  }

  rows.push(["Passengers", String(booking.passengers)]);

  if (booking.childSeats > 0) {
    rows.push(["Child seats", String(booking.childSeats)]);
  }

  if (booking.babySeats > 0) {
    rows.push(["Baby seats", String(booking.babySeats)]);
  }

  if (booking.flightNumber) {
    rows.push(["Flight", booking.flightNumber]);
  }

  return rows;
}

function paymentRows(
  booking: BookingEmailData,
  symbol: string
): EmailDetail[] {
  const rows: EmailDetail[] = [];

  if (booking.taxAmount && booking.taxAmount > 0) {
    const subtotal = booking.subtotalAmount ?? booking.totalAmount;
    rows.push(["Subtotal", `${symbol}${Number(subtotal).toFixed(2)}`]);
    rows.push([
      booking.taxIncluded
        ? `Tax (${booking.taxPercentage ?? 0}%, included)`
        : `Tax (${booking.taxPercentage ?? 0}%)`,
      `${symbol}${Number(booking.taxAmount).toFixed(2)}`,
    ]);
  }

  rows.push(["Total", `${symbol}${Number(booking.totalAmount).toFixed(2)}`]);

  if (booking.paymentMethod) {
    rows.push(["Payment method", booking.paymentMethod.replaceAll("_", " ")]);
  }

  if (booking.paymentStatus) {
    rows.push(["Payment status", booking.paymentStatus]);
  }

  return rows;
}

export function confirmationEmailHtml(
  booking: BookingEmailData,
  options: {
    currency: string;
    primaryColor: string;
    supportEmail?: string;
    invoiceUrl: string | null;
    invoiceAttached: boolean;
  }
) {
  const symbol = getCurrencySymbol(options.currency);

  const sections = [
    emailSubheading("Trip"),
    emailDetails(tripRows(booking)),
    emailSubheading("Payment"),
    emailDetails(paymentRows(booking, symbol)),
  ];

  if (booking.notes) {
    sections.push(emailSubheading("Notes"), emailParagraph(booking.notes));
  }

  if (options.invoiceAttached) {
    sections.push(
      emailParagraph("Your invoice is attached to this email as a PDF.")
    );
  }

  if (options.invoiceUrl) {
    sections.push(
      emailAction(options.invoiceUrl, "View invoice", options.primaryColor)
    );
  }

  return emailShell({
    heading: "Booking confirmed",
    primaryColor: options.primaryColor,
    intro: "Your transfer is booked. The details are below.",
    sections,
    supportEmail: options.supportEmail,
  });
}
