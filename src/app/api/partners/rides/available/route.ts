import { NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Booking } from "@/features/booking/model";
import { Partner } from "@/features/partners/model";
import { requireRole } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";
import { getPartnerDispatchSettings } from "@/features/partners/lib/get-partner-dispatch-settings";
import {
  partnerApprovedVehicleIds,
  partnerHasApprovedFleet,
} from "@/features/partners/lib/partner-fleet-eligibility";

export async function GET() {
  try {
    const access = await requireRole("partner");
    if (!access.ok) return access.response;

    await connectDB();
    const partner = await Partner.findById(access.session.user.id);
    if (!partner || !partnerHasApprovedFleet(partner)) {
      return jsonError("forbidden", 403);
    }

    const vehicleIds = partnerApprovedVehicleIds(partner);
    const { dispatchAssigneeMode } = await getPartnerDispatchSettings();

    const filter: Record<string, unknown> = {
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

    const availableRides = await Booking.find(filter)
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
