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
    if (!partner || partner.fleetStatus !== "approved") {
      return NextResponse.json(
        { success: false, message: "Partner not approved for fleet operations" },
        { status: 403 }
      );
    }

    // Find available rides that match the partner's fleet and are still available
    const availableRides = await Booking.find({
      selectedVehicle: partner.requestedFleet, // Match partner's approved fleet
      availableForPartners: true,
      status: "upcoming",
      assignedPartner: { $exists: false }, // Not yet assigned to any partner
      partnerAcceptanceDeadline: { $gt: new Date() }, // Deadline not expired
    })
    .sort({ createdAt: -1 }) // Most recent first
    .limit(50); // Limit results for performance

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