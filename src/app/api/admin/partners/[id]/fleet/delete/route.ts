import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import Partner, { type IFleetRequest } from "@/features/partners/model/Partner";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { vehicleIdBodySchema } from "@/features/partners/schema/partner-write.schema";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const parsed = await parseJsonBody(request, vehicleIdBodySchema);
    if (!parsed.ok) return parsed.response;
    const { vehicleId } = parsed.data;

    await connectDB();

    const partner = await Partner.findById(id);

    if (!partner) return jsonError("not_found", 404);

    // Remove the rejected fleet request from the array
    if (partner.fleetRequests && partner.fleetRequests.length > 0) {
      partner.fleetRequests = partner.fleetRequests.filter(
        (request: IFleetRequest) => request.vehicleId.toString() !== vehicleId
      );
    }

    await partner.save();

    return NextResponse.json({
      success: true,
      message: "Fleet request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting fleet request:", error);
    return jsonError("internal_error", 500);
  }
}
