import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/database";
import Partner, { type IFleetRequest } from "@/models/partner/Partner";
import { authOptions } from "@/lib/auth/options";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { vehicleId } = await request.json();

    if (!vehicleId) {
      return NextResponse.json(
        { success: false, message: "Vehicle ID is required" },
        { status: 400 }
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

    // Check if partner has this fleet request
    const requestIndex = partner.fleetRequests?.findIndex(
      (req: IFleetRequest) => req.vehicleId === vehicleId && req.status === "pending"
    );

    if (requestIndex === -1 || requestIndex === undefined) {
      return NextResponse.json(
        { success: false, message: "No pending request found for this vehicle" },
        { status: 404 }
      );
    }

    // Remove the fleet request
    partner.fleetRequests.splice(requestIndex, 1);
    await partner.save();

    return NextResponse.json({
      success: true,
      message: "Fleet request cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling fleet request:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
