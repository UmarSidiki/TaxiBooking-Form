import { NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Booking } from "@/features/booking/model";
import { Partner } from "@/features/partners/model";
import { requireRole } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

export async function GET() {
  try {
    const access = await requireRole("partner");
    if (!access.ok) return access.response;

    await connectDB();
    const partner = await Partner.findById(access.session.user.id);
    const hasApprovedFleet =
      partner?.currentFleet ||
      (partner?.fleetStatus === "approved" && partner?.requestedFleet);

    if (!partner || !hasApprovedFleet) return jsonError("forbidden", 403);

    const partnerVehicleId = partner.currentFleet || partner.requestedFleet;
    const availableRides = await Booking.find({
      selectedVehicle: partnerVehicleId,
      availableForPartners: true,
      status: "upcoming",
      assignedPartner: { $exists: false },
      partnerReviewStatus: "approved",
      partnerAcceptanceDeadline: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({
      success: true,
      rides: availableRides,
    });
  } catch (error) {
    console.error("Error fetching available rides:", error);
    return jsonError("internal_error", 500);
  }
}
