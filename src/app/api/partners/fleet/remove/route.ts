import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/database";
import Partner, { type IFleetRequest } from "@/models/partner/Partner";
import { authOptions } from "@/lib/auth/options";

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    // Find the partner
    const partner = await Partner.findOne({ email: session.user.email });

    if (!partner) {
      return NextResponse.json(
        { success: false, message: "Partner not found" },
        { status: 404 }
      );
    }

    // Check if partner has an approved fleet
    if (!partner.currentFleet) {
      return NextResponse.json(
        { success: false, message: "No fleet assigned to remove" },
        { status: 400 }
      );
    }

    const removedFleetId = partner.currentFleet;

    // Clear the current fleet
    partner.currentFleet = undefined;

    // Also remove the approved fleet request from fleetRequests array
    if (partner.fleetRequests && partner.fleetRequests.length > 0) {
      partner.fleetRequests = partner.fleetRequests.filter(
        (req: IFleetRequest) => !(req.vehicleId.toString() === removedFleetId.toString() && req.status === "approved")
      );
    }

    // Clear backward compatibility fields if they match the removed fleet
    if (partner.requestedFleet?.toString() === removedFleetId.toString() && partner.fleetStatus === "approved") {
      partner.requestedFleet = undefined;
      partner.fleetStatus = "none";
    }

    await partner.save();

    return NextResponse.json({
      success: true,
      message: "Fleet removed successfully",
    });
  } catch (error) {
    console.error("Error removing fleet:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
