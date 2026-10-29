import { getMongoDb } from "@/shared/db/mongodb";
import { getCurrencySymbol } from "@/shared/lib/utils";
import { resolvePublicUrl } from "@/features/settings/lib/public-url";
import { customerPortalUrl } from "@/features/customers/lib/customer-token";
import { absoluteHttpBase } from "@/features/booking/lib/booking-mail-url";
import { prepareEventEmail, sendPreparedEmail } from "@/features/emails/lib/send-event-email";
import { NoticeEmail } from "@/features/emails/templates/notice-email";
import { CancellationEmail } from "@/features/emails/templates/cancellation-email";
import type { EmailTrip } from "@/features/emails/types";

interface BookingData {
  tripId: string;
  bookingId?: string;
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
  vehicleDetails?: { name?: string; price?: string; seats?: string };
  childSeats: number;
  babySeats: number;
  notes?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  totalAmount: number;
  refundAmount?: number;
  refundPercentage?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  canceledAt?: Date | string | null;
  flightNumber?: string;
  locale?: string;
  baseUrl?: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function tripOf(booking: BookingData): EmailTrip {
  const hourly =
    booking.dropoff === "N/A (Hourly booking)" ||
    booking.dropoff === "N/A";
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
  };
}

async function baseUrlFor(booking: BookingData) {
  return (
    absoluteHttpBase(booking.baseUrl) ??
    (await resolvePublicUrl().catch(() => null))
  );
}

export async function sendOrderCancellationEmail(bookingData: BookingData) {
  try {
    if (!bookingData.email || !isValidEmail(bookingData.email)) {
      console.error("Invalid customer email address:", bookingData.email);
      return false;
    }

    const prepared = await prepareEventEmail({
      event: "booking_cancelled",
      audience: "customer",
      locale: bookingData.locale,
      values: {
        name: `${bookingData.firstName} ${bookingData.lastName}`.trim(),
        tripId: bookingData.tripId,
      },
    });
    if (!prepared) return false;

    const symbol = getCurrencySymbol(prepared.settings?.stripeCurrency || "EUR");
    const refundAmount = bookingData.refundAmount ?? 0;
    const base = await baseUrlFor(bookingData);
    const manageUrl = customerPortalUrl(base, prepared.locale, bookingData.email);
    const canceledAt = bookingData.canceledAt
      ? new Date(bookingData.canceledAt).toLocaleString(prepared.locale)
      : new Date().toLocaleString(prepared.locale);

    const priceRows = [
      {
        label: prepared.t("total"),
        value: `${symbol}${bookingData.totalAmount.toFixed(2)}`,
      },
      {
        label: prepared.t("refund_amount"),
        value: `${symbol}${refundAmount.toFixed(2)}`,
      },
      ...(typeof bookingData.refundPercentage === "number"
        ? [
            {
              label: prepared.t("refund_percentage"),
              value: `${bookingData.refundPercentage}%`,
            },
          ]
        : []),
    ];

    const sent = await sendPreparedEmail({
      prepared,
      to: bookingData.email,
      element: (
        <CancellationEmail
          t={prepared.t}
          brand={prepared.brand}
          locale={prepared.locale}
          subject={prepared.copy.subject}
          intro={prepared.copy.intro}
          trip={tripOf(bookingData)}
          priceRows={priceRows}
          details={[
            { label: prepared.t("cancelled_at"), value: canceledAt },
          ]}
          manageUrl={manageUrl}
        />
      ),
      links: [manageUrl],
    });

    if (!sent) {
      console.error("Failed to send cancellation email to:", bookingData.email);
      return false;
    }

    await sendCancellationNotificationToAdmin(bookingData);
    return true;
  } catch (error) {
    console.error("Error sending cancellation email:", error);
    return false;
  }
}

async function sendCancellationNotificationToAdmin(bookingData: BookingData) {
  try {
    const db = await getMongoDb();
    const adminUser = await db
      .collection("users")
      .findOne({ role: { $in: ["owner", "admin", "superadmin"] } });
    const adminEmail = adminUser?.email;
    if (!adminEmail || !isValidEmail(adminEmail)) {
      console.log("No valid admin user found. Cancellation alert skipped.");
      return true;
    }

    const prepared = await prepareEventEmail({
      event: "trip_change_admin",
      audience: "desk",
      locale: "en",
      values: {
        name: `${bookingData.firstName} ${bookingData.lastName}`.trim(),
        tripId: bookingData.tripId,
        pickup: bookingData.pickup,
        dropoff: bookingData.dropoff,
        date: bookingData.date,
        time: bookingData.time,
        total: bookingData.totalAmount.toFixed(2),
      },
    });
    if (!prepared) return true;

    const symbol = getCurrencySymbol(prepared.settings?.stripeCurrency || "EUR");
    return sendPreparedEmail({
      prepared,
      to: adminEmail,
      element: (
        <NoticeEmail
          t={prepared.t}
          brand={prepared.brand}
          locale={prepared.locale}
          subject={prepared.copy.subject}
          intro={prepared.copy.intro}
          status={{ label: prepared.t("status_cancelled"), tone: "danger" }}
          trip={tripOf(bookingData)}
          details={[
            {
              label: prepared.t("customer"),
              value: `${bookingData.firstName} ${bookingData.lastName}`,
            },
            { label: prepared.t("email"), value: bookingData.email },
            { label: prepared.t("phone"), value: bookingData.phone },
            {
              label: prepared.t("refund_amount"),
              value: `${symbol}${(bookingData.refundAmount ?? 0).toFixed(2)}`,
            },
          ]}
        />
      ),
    });
  } catch (error) {
    console.error("Error sending admin cancellation notification:", error);
    return false;
  }
}
