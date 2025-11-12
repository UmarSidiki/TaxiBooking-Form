import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/database";
import Partner from "@/models/partner/Partner";
import Vehicle from "@/models/vehicle/Vehicle";
import { authOptions } from "@/lib/auth/options";
import { sendFleetRequestNotificationEmail } from "@/controllers/email/admin/FleetNotification";

export async function POST(request: NextRequest) {
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

    // Check if partner is approved
    if (partner.status !== "approved") {
      return NextResponse.json(
        { success: false, message: "Only approved partners can request fleet assignment" },
        { status: 403 }
      );
    }

    // Check if partner already has a pending fleet request
    if (partner.fleetStatus === "pending") {
      return NextResponse.json(
        { success: false, message: "You already have a pending fleet request" },
        { status: 400 }
      );
    }

    // Allow partners to request different vehicles even if they have approved assignments
    // Reset the fleet status to pending for new requests
    // if (partner.fleetStatus === "approved") {
    //   return NextResponse.json(
    //     { success: false, message: "You already have an approved fleet assignment" },
    //     { status: 400 }
    //   );
    // }

    // Verify vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return NextResponse.json(
        { success: false, message: "Vehicle not found" },
        { status: 404 }
      );
    }

    // Update partner with fleet request
    partner.requestedFleet = vehicleId;
    partner.fleetStatus = "pending";
    partner.fleetRequestedAt = new Date();

    await partner.save();

    // Send email notification to admin
    try {
      await sendFleetRequestNotificationEmail({
        partnerName: partner.name,
        partnerEmail: partner.email,
        vehicleName: vehicle.name,
        vehicleCategory: vehicle.category,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
      });
    } catch (emailError) {
      console.error("Failed to send fleet request notification email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Fleet assignment request submitted successfully",
    });
  } catch (error) {
    console.error("Error requesting fleet:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}