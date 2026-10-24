import { NextResponse } from "next/server";

import { Driver } from "@/features/drivers/model";
import { requireRole } from "@/features/auth/lib/require-role";
import { connectDB } from "@/shared/db";
import { jsonError } from "@/shared/http/json-error";

export async function GET() {
  try {
    const access = await requireRole("driver");
    if (!access.ok) return access.response;

    await connectDB();
    const driver = await Driver.findById(access.session.user.id).select("-password");
    if (!driver) return jsonError("not_found", 404);

    return NextResponse.json({ success: true, data: driver });
  } catch (error) {
    console.error("Error fetching driver profile:", error);
    return jsonError("internal_error", 500);
  }
}
