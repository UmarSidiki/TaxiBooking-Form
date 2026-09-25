import { sendOrderConfirmationEmail } from "@/features/booking/email/order-confirmation";
import { absoluteHttpBase } from "@/features/booking/lib/booking-mail-url";
import {
  createBookingDocument,
  updateBookingFields,
} from "@/features/booking/lib/booking.repo";
import { getSettingsCurrency } from "@/features/booking/lib/get-settings-currency";
import { initCashBookingPartners } from "@/features/booking/lib/init-cash-booking-partners";
import { mintPaymentToken } from "@/features/booking/lib/payment-token";
import { sendAppointmentPatchEmails } from "@/features/booking/lib/send-appointment-patch-emails";
import type {
  DeskBookingInput,
  DeskBookingOutcome,
} from "@/features/desk-booking/schema/desk-booking.schema";
import { calculateBookingPrice } from "@/features/payments/lib/fare/calculate-booking-price";
import { fetchRouteDistanceKm } from "@/features/payments/lib/fare/route-distance";
import { loadPaymentSettings } from "@/features/payments/lib/load-payment-settings";
import { buildBookingEmailDataFromBooking } from "@/features/payments/lib/booking-email-data";
import { connectDB } from "@/shared/db";
import { generateTripId } from "@/shared/lib/generate-id";
import { isDuplicateKeyError } from "@/shared/lib/mongo-error";
import { getCurrencySymbol } from "@/shared/lib/utils";
import { sanitizeInput } from "@/shared/lib/validation";
import { Vehicle } from "@/features/fleet/model";

export type CreateDeskBookingResult =
  | {
      ok: true;
      bookingId: string;
      tripId: string;
      totalAmount: number;
      outcome: DeskBookingOutcome;
    }
  | { ok: false; status: number; message: string };

export async function createDeskBooking(
  formData: DeskBookingInput,
  placedBy: { userId?: string; name?: string },
  baseUrl?: string
): Promise<CreateDeskBookingResult> {
  await connectDB();

  const vehicle = await Vehicle.findById(formData.selectedVehicle);
  if (!vehicle) {
    return { ok: false, status: 404, message: "Selected vehicle not found" };
  }
  if (!vehicle.isActive) {
    return { ok: false, status: 400, message: "Selected vehicle is not available" };
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

  const isManualPrice = formData.manualPrice !== undefined;
  if (!isManualPrice && priced.total <= 0) {
    return { ok: false, status: 400, message: "Calculated fare is zero" };
  }

  const total = isManualPrice ? formData.manualPrice! : priced.total;
  const isQuote = formData.outcome === "quote";

  if (isQuote && !absoluteHttpBase(baseUrl)) {
    return {
      ok: false,
      status: 400,
      message:
        "Cannot send pay link: set NEXT_PUBLIC_BASE_URL or call from a public origin",
    };
  }

  const paymentToken = isQuote ? mintPaymentToken() : null;
  const tripId = generateTripId();
  const currency = await getSettingsCurrency();
  const currencySymbol = getCurrencySymbol(currency);
  const paymentMethod = isQuote
    ? "unpaid"
    : formData.paymentMethod || "cash";

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
    paymentMethod,
    paymentStatus: "pending" as const,
    status: isQuote ? ("awaiting_payment" as const) : ("upcoming" as const),
    priceSource: isManualPrice ? ("manual" as const) : ("computed" as const),
    createdBy: {
      userId: placedBy.userId,
      name: placedBy.name,
    },
    totalAmount: total,
    subtotalAmount: isManualPrice ? total : priced.subtotal,
    taxAmount: isManualPrice ? 0 : priced.taxAmount,
    taxPercentage: isManualPrice ? 0 : priced.taxPercentage,
    ...(isQuote
      ? {
          quotedAmount: total,
          quotedAt: new Date(),
          paymentTokenHash: paymentToken!.hash,
        }
      : {}),
  };

  let saved;
  try {
    saved = await createBookingDocument(bookingData);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return { ok: false, status: 409, message: "Duplicate trip reference" };
    }
    throw error;
  }

  const bookingId = saved._id.toString();

  if (isQuote) {
    if (!formData.notifyCustomer) {
      return { ok: true, bookingId, tripId, totalAmount: total, outcome: "quote" };
    }

    const emailResult = await sendAppointmentPatchEmails({
      action: "quote",
      booking: saved,
      paymentToken: paymentToken!.token,
      baseUrl,
    });
    if (!emailResult.ok) {
      return { ok: false, status: 502, message: emailResult.message };
    }

    return { ok: true, bookingId, tripId, totalAmount: total, outcome: "quote" };
  }

  if (formData.paymentCollected) {
    await updateBookingFields(bookingId, { paymentStatus: "completed" });
  }

  await initCashBookingPartners(bookingId, paymentMethod, total, baseUrl);

  if (formData.notifyCustomer) {
    const emailData = buildBookingEmailDataFromBooking(saved, {
      paymentMethod,
      currency,
      baseUrl,
    });
    const sent = await sendOrderConfirmationEmail(emailData);
    if (sent) {
      await updateBookingFields(bookingId, { confirmationEmailSent: true });
    }
  }

  return {
    ok: true,
    bookingId,
    tripId,
    totalAmount: total,
    outcome: "confirmed",
  };
}
