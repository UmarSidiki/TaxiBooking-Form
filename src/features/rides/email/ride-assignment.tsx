import { getCurrencySymbol } from "@/shared/lib/utils";
import { absoluteHttpBase, bookingMailLocale } from "@/features/booking/lib/booking-mail-url";
import { prepareEventEmail, sendPreparedEmail } from "@/features/emails/lib/send-event-email";
import { AssigneeEmail } from "@/features/emails/templates/assignee-email";
import type { EmailTrip } from "@/features/emails/types";

interface RideAssignmentData {
  tripId: string;
  pickup: string;
  dropoff: string;
  stops?: Array<{ location: string; order: number; duration?: number }>;
  tripType?: string;
  date: string;
  time: string;
  returnDate?: string;
  returnTime?: string;
  passengers?: number;
  selectedVehicle?: string;
  vehicleDetails?: { name: string; price: string; seats: string };
  childSeats?: number;
  babySeats?: number;
  notes?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  totalAmount: number;
  paymentMethod?: string;
  paymentStatus?: string;
  flightNumber?: string;
  driverName: string;
  driverEmail: string;
  vehicleType?: string;
  passengerName?: string;
  passengerPhone?: string;
  baseUrl?: string;
  audience?: "driver" | "partner";
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function tripOf(data: RideAssignmentData): EmailTrip {
  return {
    tripId: data.tripId,
    pickup: data.pickup,
    dropoff: data.dropoff || null,
    stops: data.stops ?? [],
    date: data.date,
    time: data.time,
    returnDate: data.tripType === "roundtrip" ? data.returnDate : null,
    returnTime: data.tripType === "roundtrip" ? data.returnTime : null,
    vehicle: data.vehicleType || data.vehicleDetails?.name || null,
    passengers: data.passengers,
    childSeats: data.childSeats,
    babySeats: data.babySeats,
    flightNumber: data.flightNumber,
  };
}

function portalUrl(baseUrl: string | undefined, locale: string, audience: "driver" | "partner") {
  const base = absoluteHttpBase(baseUrl);
  if (!base) return null;
  return `${base}/${bookingMailLocale(locale)}/${audience === "partner" ? "partners/dashboard" : "drivers"}`;
}

export async function sendRideAssignmentEmail(data: RideAssignmentData) {
  try {
    if (!data.driverEmail || !isValidEmail(data.driverEmail)) {
      console.error("Invalid driver email address:", data.driverEmail);
      return false;
    }

    const audience = data.audience ?? "driver";
    const prepared = await prepareEventEmail({
      event: "ride_assigned",
      audience,
      locale: "en",
      values: {
        tripId: data.tripId,
        pickup: data.pickup,
        date: data.date,
        time: data.time,
      },
    });
    if (!prepared) return false;

    const symbol = getCurrencySymbol(prepared.settings?.stripeCurrency || "EUR");
    const url = portalUrl(data.baseUrl, prepared.locale, audience);

    return sendPreparedEmail({
      prepared,
      to: data.driverEmail,
      element: (
        <AssigneeEmail
          t={prepared.t}
          brand={prepared.brand}
          locale={prepared.locale}
          subject={prepared.copy.subject}
          intro={prepared.copy.intro}
          trip={tripOf(data)}
          status={{ label: prepared.t("status_assigned"), tone: "info" }}
          details={[
            {
              label: prepared.t("passenger"),
              value: data.passengerName || `${data.firstName} ${data.lastName}`,
            },
            {
              label: prepared.t("contact"),
              value: data.passengerPhone || data.phone,
            },
            ...(data.notes ? [{ label: prepared.t("notes"), value: data.notes }] : []),
          ]}
          priceRows={[
            {
              label: prepared.t("total"),
              value: `${symbol}${data.totalAmount.toFixed(2)}`,
            },
          ]}
          cta={url ? { url, label: prepared.t("view_ride") } : null}
        />
      ),
      links: [url],
    });
  } catch (error) {
    console.error("Error sending ride assignment email:", error);
    return false;
  }
}
