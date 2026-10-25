import { Booking, type IBooking } from "@/features/booking/model";
import { getPartnerDispatchSettings } from "@/features/partners/lib/get-partner-dispatch-settings";

type ClaimPartner = {
  _id: { toString(): string } | string;
  name: string;
  email: string;
};

/**
 * Atomically claim an open overflow ride.
 * Returns the updated booking, or null when another assignee won the race.
 */
export async function claimPartnerRide(
  rideId: string,
  partner: ClaimPartner,
  vehicleIds: string[],
): Promise<IBooking | null> {
  const { dispatchAssigneeMode } = await getPartnerDispatchSettings();
  const unset: Record<string, 1> = { partnerAcceptanceDeadline: 1 };
  if (dispatchAssigneeMode === "exclusive") {
    unset.assignedDriver = 1;
  }

  const filter: Record<string, unknown> = {
    _id: rideId,
    selectedVehicle: { $in: vehicleIds },
    availableForPartners: true,
    status: "upcoming",
    partnerReviewStatus: "approved",
    partnerAcceptanceDeadline: { $gt: new Date() },
    $or: [
      { assignedPartner: { $exists: false } },
      { assignedPartner: null },
    ],
  };

  if (dispatchAssigneeMode === "exclusive") {
    filter.$and = [
      {
        $or: [
          { assignedDriver: { $exists: false } },
          { assignedDriver: null },
        ],
      },
    ];
  }

  return Booking.findOneAndUpdate(
    filter,
    {
      $set: {
        assignedPartner: {
          _id: String(partner._id),
          name: partner.name,
          email: partner.email,
        },
        availableForPartners: false,
        assignmentEmailSent: false,
        responsibleAssignee: "partner",
      },
      $unset: unset,
    },
    { returnDocument: "after", runValidators: true },
  );
}
