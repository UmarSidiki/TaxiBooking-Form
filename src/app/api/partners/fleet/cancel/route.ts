import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/shared/db";
import Partner, { type IFleetRequest } from "@/features/partners/model/Partner";
import { authOptions } from "@/features/auth";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { vehicleIdBodySchema } from "@/features/partners/schema/partner-write.schema";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return jsonError("unauthorized", 401);

    const parsed = await parseJsonBody(request, vehicleIdBodySchema);
    if (!parsed.ok) return parsed.response;
    const { vehicleId } = parsed.data;

    await connectDB();
    const partner = await Partner.findOne({ email: session.user.email });
    if (!partner) return jsonError("not_found", 404);

    const requestIndex = partner.fleetRequests?.findIndex(
      (req: IFleetRequest) =>
        req.vehicleId.toString() === vehicleId && req.status === "pending"
    );
    if (requestIndex === -1 || requestIndex === undefined) {
      return jsonError("not_found", 404);
    }

    partner.fleetRequests.splice(requestIndex, 1);
    await partner.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling fleet request:", error);
    return jsonError("internal_error", 500);
  }
}
