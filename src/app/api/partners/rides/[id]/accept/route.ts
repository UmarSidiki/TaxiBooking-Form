import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Partner } from "@/features/partners/model";
import { sendRideAssignmentEmail } from "@/features/rides/email/ride-assignment";
import { requireRole } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";
import { claimPartnerRide } from "@/features/partners/lib/claim-partner-ride";
import { recordRideActivity } from "@/features/rides/lib/record-ride-activity";
import { queueAssigneeNotice } from "@/features/settings/lib/assignee-whatsapp";
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
    const updatedRide = await claimPartnerRide(rideId, partner, vehicleIds);

    if (!updatedRide) {
      return jsonError("conflict", 409);
    }
    queueAssigneeNotice({
      kind: "assigned",
      recipients: [{ phone: partner.phone, name: partner.name }],
      ride: {
        tripId: updatedRide.tripId,
        pickup: updatedRide.pickup,
        date: updatedRide.date,
        time: updatedRide.time,
      },
    });
    await recordRideActivity({
      bookingId: String(updatedRide._id),
      actorId: access.session.user.id,
      actorRole: "partner",
      action: "claimed",
    });

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
