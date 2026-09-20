import { NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Partner } from "@/features/partners/model";
import { requireRole } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

export async function GET() {
  try {
    const access = await requireRole("partner");
    if (!access.ok) return access.response;

    await connectDB();
    const partner = await Partner.findById(access.session.user.id).select(
      "-password"
    );
    if (!partner) return jsonError("not_found", 404);

    return NextResponse.json({ success: true, partner }, { status: 200 });
  } catch (error) {
    console.error("Error fetching partner profile:", error);
    return jsonError("internal_error", 500);
  }
}
