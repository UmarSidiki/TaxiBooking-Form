import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/database";
import { Booking } from "@/models/booking";
import { authOptions } from "@/lib/auth/options";
import { Partner } from "@/models/partner";
import { sendRideAssignmentEmail } from "@/controllers/email/bookings";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "partner") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const rideId = id;
    if (!rideId) {
      return NextResponse.json(
        { success: false, message: "Ride ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Get the partner
    const partner = await Partner.findById(session.user.id);
    
    // Check if partner has an approved fleet (check both new and old system)
    const hasApprovedFleet = partner?.currentFleet || 
                              (partner?.fleetStatus === "approved" && partner?.requestedFleet);
    
    if (!partner || !hasApprovedFleet) {
      return NextResponse.json(
        { success: false, message: "Partner not approved for fleet operations" },
        { status: 403 }
      );
    }

    // Get the vehicle ID from currentFleet or requestedFleet
    const partnerVehicleId = partner.currentFleet || partner.requestedFleet;

    console.log(`Partner ${partner.name} (${partner._id}) attempting to accept ride ${rideId}`);

    // Use MongoDB's atomic findOneAndUpdate to ensure first-come-first-served
    // All validations are done atomically to prevent race conditions
    const updatedRide = await Booking.findOneAndUpdate(
      {
        _id: rideId,
        selectedVehicle: partnerVehicleId, // Ensure it matches partner's fleet
        availableForPartners: true,
        status: "upcoming", // Only upcoming rides can be accepted
        assignedPartner: { $exists: false }, // Not assigned yet
        partnerAcceptanceDeadline: { $gt: new Date() }, // Deadline not expired
      },
      {
        assignedPartner: {
          _id: partner._id,
          name: partner.name,
          email: partner.email,
        },
        availableForPartners: false,
        assignmentEmailSent: false, // Reset to send assignment email
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedRide) {
      console.log(`Ride ${rideId} was already assigned to another partner or unavailable`);
      return NextResponse.json(
        { success: false, message: "Ride was already assigned to another partner" },
        { status: 409 }
      );
    }

    console.log(`Successfully assigned ride ${rideId} to partner ${partner.name}`);

    // Send assignment confirmation email
    try {
      await sendRideAssignmentEmail({
        tripId: updatedRide.tripId,
        driverName: partner.name,
        driverEmail: partner.email,
        pickup: updatedRide.pickup,
        dropoff: updatedRide.dropoff || 'N/A',
        stops: updatedRide.stops || [],
        tripType: updatedRide.tripType,
        date: updatedRide.date,
        time: updatedRide.time,
        returnDate: updatedRide.returnDate,
        returnTime: updatedRide.returnTime,
        passengers: updatedRide.passengers,
        selectedVehicle: updatedRide.selectedVehicle,
        vehicleDetails: updatedRide.vehicleDetails ? {
          name: updatedRide.vehicleDetails.name,
          price: updatedRide.vehicleDetails.price,
          seats: updatedRide.vehicleDetails.seats,
        } : undefined,
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
            : typeof updatedRide.totalAmount === "number"
            ? updatedRide.totalAmount
            : 0,
        flightNumber: updatedRide.flightNumber,
      });
    } catch (emailError) {
      console.error("Error sending assignment email:", emailError);
      // Continue even if email fails
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
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to accept ride",
      },
      { status: 500 }
    );
  }
}