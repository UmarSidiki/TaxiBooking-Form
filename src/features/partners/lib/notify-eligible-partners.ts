import { Booking, type IBooking } from "@/features/booking/model";
import { Partner } from "@/features/partners/model";
import { sendRideNotificationEmail } from "@/features/partners/email/notification";
import { getCurrencySymbol } from "@/shared/lib/utils";
import { Setting } from "@/features/settings/model";

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
      {
        fleetRequests: {
          $elemMatch: { vehicleId: partnerVehicleId, status: "approved" },
        },
      },
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

  if (typeof booking.partnerPayoutAmount !== "number") {
    console.error(
      "notifyEligiblePartners: partnerPayoutAmount missing; refusing notify",
      booking._id
    );
    return { eligibleCount: 0, notifiedCount: 0 };
  }

  const settings = await Setting.findOne();
  const currencySymbol = resolveCurrencySymbol(settings?.stripeCurrency);
  const partnerAmount = booking.partnerPayoutAmount;

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
