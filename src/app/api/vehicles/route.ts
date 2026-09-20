import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Vehicle } from "@/features/fleet/model";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { vehicleWriteSchema } from "@/features/fleet/schema/vehicle-write.schema";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");
    const filter = isActive !== null ? { isActive: isActive === "true" } : {};
    const vehicles = await Vehicle.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: vehicles });
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return jsonError("internal_error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const parsed = await parseJsonBody(request, vehicleWriteSchema);
    if (!parsed.ok) return parsed.response;

    await connectDB();
    const vehicle = await Vehicle.create(parsed.data);

    return NextResponse.json(
      { success: true, data: vehicle },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating vehicle:", error);
    return jsonError("internal_error", 500);
  }
}
