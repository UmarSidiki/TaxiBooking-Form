import { Booking, type IBooking } from "@/models/booking";
import { Partner } from "@/models/partner";
import { sendRideNotificationEmail } from "@/controllers/email/partners";
import { getCurrencySymbol } from "@/lib/utils";
import { Setting } from "@/models/settings";

interface NotifyEligiblePartnersResult {
  eligibleCount: number;
  notifiedCount: number;
}

function resolveCurrencySymbol(currencyCode?: string | null) {
  if (!currencyCode) {
    return "€";
  }
  return getCurrencySymbol(currencyCode.toUpperCase());
}

export async function notifyEligiblePartners(
  booking: IBooking,
  baseUrl?: string
): Promise<NotifyEligiblePartnersResult> {
  if (!booking?._id) {
    return { eligibleCount: 0, notifiedCount: 0 };
  }

  const partnerVehicleId = booking.selectedVehicle;
  if (!partnerVehicleId) {
    return { eligibleCount: 0, notifiedCount: 0 };
  }

  const eligiblePartners = await Partner.find({
    status: "approved",
    isActive: true,
    $or: [
      { currentFleet: partnerVehicleId },
      { fleetStatus: "approved", requestedFleet: partnerVehicleId },
    ],
  });

  if (!eligiblePartners.length) {
    await Booking.findByIdAndUpdate(booking._id, {
      $set: {
        partnerNotificationSent: false,
        eligiblePartnersCount: 0,
        availableForPartners: false,
      },
    });
    return { eligibleCount: 0, notifiedCount: 0 };
  }

  const settings = await Setting.findOne();
  const currencySymbol = resolveCurrencySymbol(settings?.stripeCurrency);
  const partnerAmount =
    typeof booking.partnerPayoutAmount === "number"
      ? booking.partnerPayoutAmount
      : typeof booking.totalAmount === "number"
      ? booking.totalAmount
      : 0;

  const notificationResults = await Promise.all(
    eligiblePartners.map((partner) =>
      sendRideNotificationEmail({
        tripId: booking.tripId,
        pickup: booking.pickup,
        dropoff: booking.dropoff || "",
        date: booking.date,
        time: booking.time,
        vehicleType: booking.vehicleDetails?.name || partnerVehicleId.toString(),
        passengerCount: booking.passengers,
        partnerName: partner.name,
        partnerEmail: partner.email,
        baseUrl,
        partnerAmount,
        currencySymbol,
      })
    )
  );

  const notifiedCount = notificationResults.filter(Boolean).length;

  await Booking.findByIdAndUpdate(booking._id, {
    $set: {
      partnerNotificationSent: notifiedCount > 0,
      eligiblePartnersCount: eligiblePartners.length,
      availableForPartners: true,
      partnerAcceptanceDeadline: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  return {
    eligibleCount: eligiblePartners.length,
    notifiedCount,
  };
}
