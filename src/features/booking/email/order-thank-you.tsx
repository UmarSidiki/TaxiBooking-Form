import {
  absoluteHttpBase,
  bookingMailLocale,
} from "@/features/booking/lib/booking-mail-url";
import { customerPortalUrl } from "@/features/customers/lib/customer-token";
import { prepareEventEmail, sendPreparedEmail } from "@/features/emails/lib/send-event-email";
import { ThankYouEmail } from "@/features/emails/templates/thank-you-email";
import type { EmailTrip } from "@/features/emails/types";

interface BookingData {
  tripId: string;
  pickup: string;
  dropoff: string;
  stops: Array<{ location: string; order: number; duration?: number }>;
  tripType: string;
  date: string;
  time: string;
  returnDate?: string;
  returnTime?: string;
  passengers: number;
  selectedVehicle: string;
  vehicleDetails: {
    name: string;
    price: string;
    seats: string;
  };
  childSeats: number;
  babySeats: number;
  notes: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  totalAmount: number;
  subtotalAmount?: number;
  taxAmount?: number;
  taxPercentage?: number;
  taxIncluded?: boolean;
  paymentMethod?: string;
  paymentStatus?: string;
  flightNumber?: string;
  bookingId?: string;
  baseUrl?: string;
  locale?: string;
  bookingType?: string;
  duration?: number;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function tripOf(booking: BookingData): EmailTrip {
  const hourly =
    booking.bookingType === "hourly" ||
    booking.dropoff === "N/A (Hourly booking)";
  return {
    tripId: booking.tripId,
    pickup: booking.pickup,
    dropoff: hourly ? null : booking.dropoff,
    stops: booking.stops ?? [],
    date: booking.date,
    time: booking.time,
    returnDate: booking.tripType === "roundtrip" ? booking.returnDate : null,
    returnTime: booking.tripType === "roundtrip" ? booking.returnTime : null,
    vehicle: booking.vehicleDetails?.name || booking.selectedVehicle,
    passengers: booking.passengers,
    childSeats: booking.childSeats,
    babySeats: booking.babySeats,
    flightNumber: booking.flightNumber,
    duration: booking.duration,
    bookingType: booking.bookingType,
  };
}

export async function sendOrderThankYouEmail(bookingData: BookingData) {
  try {
    if (!bookingData.email || !isValidEmail(bookingData.email)) {
      console.error("Invalid customer email address:", bookingData.email);
      return false;
    }

    const prepared = await prepareEventEmail({
      event: "thank_you",
      audience: "customer",
      locale: bookingData.locale,
      values: {
        name: `${bookingData.firstName} ${bookingData.lastName}`.trim(),
        tripId: bookingData.tripId,
        pickup: bookingData.pickup,
        date: bookingData.date,
        time: bookingData.time,
      },
    });
    if (!prepared) return false;

    const base = absoluteHttpBase(bookingData.baseUrl);
    const reviewUrl =
      bookingData.bookingId && base
        ? `${base}/${bookingMailLocale(bookingData.locale)}/review?bookingId=${encodeURIComponent(bookingData.bookingId)}`
        : null;
    const manageUrl = customerPortalUrl(
      base,
      prepared.locale,
      bookingData.email,
    );

    return sendPreparedEmail({
      prepared,
      to: bookingData.email,
      element: (
        <ThankYouEmail
          t={prepared.t}
          brand={prepared.brand}
          locale={prepared.locale}
          subject={prepared.copy.subject}
          intro={prepared.copy.intro}
          trip={tripOf(bookingData)}
          reviewUrl={reviewUrl}
          manageUrl={manageUrl}
        />
      ),
      links: [reviewUrl, manageUrl],
    });
  } catch (error) {
    console.error("Error sending thank you email:", error);
    return false;
  }
}
