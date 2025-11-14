import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/database";
import { Booking } from "@/models/booking";
import { authOptions } from "@/lib/auth/options";
import { Partner } from "@/models/partner";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "partner") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    // Get partner's approved fleet type
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

    console.log(`Partner ${partner.name} (${partner._id}) has approved fleet: ${partnerVehicleId}`);

    // Find available rides that match the partner's fleet and are still available
    const availableRides = await Booking.find({
      selectedVehicle: partnerVehicleId, // Match partner's approved fleet
      availableForPartners: true,
      status: "upcoming",
      assignedPartner: { $exists: false }, // Not yet assigned to any partner
      partnerReviewStatus: "approved",
      partnerAcceptanceDeadline: { $gt: new Date() }, // Deadline not expired
    })
    .sort({ createdAt: -1 }) // Most recent first
    .limit(50); // Limit results for performance

    console.log(`Found ${availableRides.length} available rides for partner ${partner.name}`);

    return NextResponse.json({
      success: true,
      rides: availableRides,
    });
  } catch (error) {
    console.error("Error fetching available rides:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch available rides",
      },
      { status: 500 }
    );
  }
}