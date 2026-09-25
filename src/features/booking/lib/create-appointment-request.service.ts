import { sendRequestReceivedEmail } from "@/features/booking/email/request-received";
import { sendNewAppointmentRequestAdminEmail } from "@/features/booking/email/new-appointment-request-admin";
import { connectDB } from "@/shared/db";
import { generateTripId } from "@/shared/lib/generate-id";
import { getCurrencySymbol } from "@/shared/lib/utils";
import { sanitizeInput } from "@/shared/lib/validation";
import {
  createBookingDocument,
  findRecentDuplicateBooking,
  updateBookingFields,
} from "@/features/booking/lib/booking.repo";
import { createCashBookingEmailData } from "@/features/booking/lib/create-cash-booking-email-data";
import { getSettingsCurrency } from "@/features/booking/lib/get-settings-currency";
import { isAppointmentRequestEnabled } from "@/features/booking/lib/is-appointment-request-enabled";
import { calculateBookingPrice } from "@/features/payments/lib/fare/calculate-booking-price";
import { fetchRouteDistanceKm } from "@/features/payments/lib/fare/route-distance";
import { loadPaymentSettings } from "@/features/payments/lib/load-payment-settings";
import type { CashBookingInput } from "@/features/booking/schema/cash-booking.schema";
import { Vehicle } from "@/features/fleet/model";

export type CreateAppointmentRequestResult =
  | { ok: true; tripId: string; totalAmount: number; message: string }
  | { ok: false; status: number; message: string };

export async function createAppointmentRequest(
  formData: CashBookingInput,
  baseUrl?: string
): Promise<CreateAppointmentRequestResult> {
  if (!(await isAppointmentRequestEnabled())) {
    return { ok: false, status: 400, message: "Appointment request is disabled" };
  }

  await connectDB();
  const vehicle = await Vehicle.findById(formData.selectedVehicle);
  if (!vehicle) {
    return { ok: false, status: 404, message: "Selected vehicle not found" };
  }
  if (!vehicle.isActive) {
    return { ok: false, status: 400, message: "Selected vehicle is not available" };
  }

  const existing = await findRecentDuplicateBooking({
    email: formData.email,
    phone: formData.phone,
    pickup: formData.pickup,
    date: formData.date,
    time: formData.time,
  });
  if (existing) {
    return {
      ok: true,
      tripId: existing.tripId,
      totalAmount: existing.totalAmount ?? 0,
      message: "Request already received",
    };
  }

  const { settings } = await loadPaymentSettings();
  const distanceKm =
    formData.bookingType === "hourly"
      ? undefined
      : await fetchRouteDistanceKm({
          pickup: formData.pickup,
          dropoff: formData.dropoff || "",
          stops: formData.stops,
        });

  const priced = calculateBookingPrice(
    vehicle,
    formData,
    settings ?? {},
    distanceKm
  );

  // Never store a destination fare that silently ignored the route distance.
  if (
    formData.bookingType !== "hourly" &&
    formData.pickup &&
    formData.dropoff &&
    distanceKm == null
  ) {
    return { ok: false, status: 400, message: "Could not calculate the route distance" };
  }

  if (priced.total <= 0) {
    return { ok: false, status: 400, message: "Calculated fare is zero" };
  }
  const tripId = generateTripId();
  const currency = await getSettingsCurrency();
  const currencySymbol = getCurrencySymbol(currency);

  const bookingData = {
    tripId,
    pickup: formData.pickup,
    dropoff: formData.dropoff || "",
    stops: formData.stops || [],
    tripType: formData.tripType,
    bookingType: formData.bookingType,
    duration: formData.duration,
    date: formData.date,
    time: formData.time,
    returnDate: formData.returnDate,
    returnTime: formData.returnTime,
    passengers: formData.passengers,
    selectedVehicle: formData.selectedVehicle,
    vehicleDetails: {
      name: vehicle.name,
      price: `${currencySymbol}${vehicle.price}`,
      seats: `${vehicle.persons} persons`,
    },
    childSeats: formData.childSeats,
    babySeats: formData.babySeats,
    notes: sanitizeInput(formData.notes || ""),
    flightNumber: formData.flightNumber
      ? sanitizeInput(formData.flightNumber)
      : undefined,
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    phone: formData.phone,
    whatsappOptIn: formData.whatsappOptIn ?? false,
    locale: formData.locale,
    paymentMethod: "unpaid",
    paymentStatus: "pending" as const,
    status: "requested" as const,
    estimatedAmount: priced.total,
    totalAmount: priced.total,
    subtotalAmount: priced.subtotal,
    taxAmount: priced.taxAmount,
    taxPercentage: priced.taxPercentage,
  };

  const saved = await createBookingDocument(bookingData);

  const emailData = await createCashBookingEmailData(
    {
      ...formData,
      totalAmount: priced.total,
      subtotalAmount: priced.subtotal,
      taxAmount: priced.taxAmount,
      taxPercentage: priced.taxPercentage,
    },
    vehicle,
    tripId,
    priced.total,
    baseUrl,
    saved._id.toString()
  );

  try {
    const customerSent = await sendRequestReceivedEmail(emailData);
    const adminSent = await sendNewAppointmentRequestAdminEmail(emailData);
    if (!adminSent) {
      console.error("Appointment-request admin notification failed:", tripId);
    }
    if (customerSent || adminSent) {
      await updateBookingFields(saved._id.toString(), {
        ...(customerSent ? { requestEmailSent: true } : {}),
        ...(adminSent ? { adminRequestEmailSent: true } : {}),
      });
    }
  } catch {
    // keep request create resilient
  }

  return {
    ok: true,
    tripId,
    totalAmount: priced.total,
    message: "Request received",
  };
}
