import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Booking } from "@/features/booking/model";
import { Partner } from "@/features/partners/model";
import { sendRideAssignmentEmail } from "@/features/rides/email/ride-assignment";
import { requireRole } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";
import { getPartnerDispatchSettings } from "@/features/partners/lib/get-partner-dispatch-settings";
import {
  partnerApprovedVehicleIds,
  partnerHasApprovedFleet,
} from "@/features/partners/lib/partner-fleet-eligibility";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireRole("partner");
    if (!access.ok) return access.response;

    const { id } = await params;
    const rideId = id;
    if (!rideId) return jsonError("invalid_body", 400);

    await connectDB();

    const partner = await Partner.findById(access.session.user.id);
    if (!partner || !partnerHasApprovedFleet(partner)) {
      return jsonError("forbidden", 403);
    }

    const vehicleIds = partnerApprovedVehicleIds(partner);
    const { dispatchAssigneeMode } = await getPartnerDispatchSettings();

    const update: Record<string, unknown> = {
      $set: {
        assignedPartner: {
          _id: String(partner._id),
          name: partner.name,
          email: partner.email,
        },
        availableForPartners: false,
        assignmentEmailSent: false,
      },
      $unset: {
        partnerAcceptanceDeadline: 1,
      } as Record<string, 1>,
    };

    if (dispatchAssigneeMode === "exclusive") {
      (update.$unset as Record<string, 1>).assignedDriver = 1;
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

    // Exclusive: do not steal a ride already assigned to a Driver
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

    const updatedRide = await Booking.findOneAndUpdate(filter, update, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!updatedRide) {
      return jsonError("conflict", 409);
    }

    try {
      await sendRideAssignmentEmail({
        tripId: updatedRide.tripId,
        driverName: partner.name,
        driverEmail: partner.email,
        pickup: updatedRide.pickup,
        dropoff: updatedRide.dropoff || "N/A",
        stops: updatedRide.stops || [],
        tripType: updatedRide.tripType,
        date: updatedRide.date,
        time: updatedRide.time,
        returnDate: updatedRide.returnDate,
        returnTime: updatedRide.returnTime,
        passengers: updatedRide.passengers,
        selectedVehicle: updatedRide.selectedVehicle,
        vehicleDetails: updatedRide.vehicleDetails
          ? {
              name: updatedRide.vehicleDetails.name,
              price: updatedRide.vehicleDetails.price,
              seats: updatedRide.vehicleDetails.seats,
            }
          : undefined,
        childSeats: updatedRide.childSeats,
        babySeats: updatedRide.babySeats,
        notes: updatedRide.notes,
        firstName: updatedRide.firstName,
        lastName: updatedRide.lastName,
        email: updatedRide.email,
        phone: updatedRide.phone,
        totalAmount:
          typeof updatedRide.partnerPayoutAmount === "number"
            ? updatedRide.partnerPayoutAmount
            : 0,
        flightNumber: updatedRide.flightNumber,
      });
    } catch (emailError) {
      console.error("Error sending assignment email:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Ride accepted successfully",
      ride: {
        _id: updatedRide._id,
        tripId: updatedRide.tripId,
        pickup: updatedRide.pickup,
        dropoff: updatedRide.dropoff,
        date: updatedRide.date,
        time: updatedRide.time,
      },
    });
  } catch (error) {
    console.error("Error accepting ride:", error);
    return jsonError("internal_error", 500);
  }
}
