import { NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import Partner, { type IFleetRequest } from "@/features/partners/model/Partner";
import { requireRole } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

export async function DELETE() {
  try {
    const access = await requireRole("partner");
    if (!access.ok) return access.response;

    await connectDB();
    const partner = await Partner.findById(access.session.user.id);
    if (!partner) return jsonError("not_found", 404);
    if (!partner.currentFleet) return jsonError("not_found", 404);

    const removedFleetId = partner.currentFleet;
    partner.currentFleet = undefined;

    if (partner.fleetRequests && partner.fleetRequests.length > 0) {
      partner.fleetRequests = partner.fleetRequests.filter(
        (req: IFleetRequest) =>
          !(
            req.vehicleId.toString() === removedFleetId.toString() &&
            req.status === "approved"
          )
      );
    }

    if (
      partner.requestedFleet?.toString() === removedFleetId.toString() &&
      partner.fleetStatus === "approved"
    ) {
      partner.requestedFleet = undefined;
      partner.fleetStatus = "none";
    }

    await partner.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing fleet:", error);
    return jsonError("internal_error", 500);
  }
}
