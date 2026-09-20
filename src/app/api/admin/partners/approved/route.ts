import { NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Partner } from "@/features/partners/model";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

export async function GET() {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    await connectDB();
    const partners = await Partner.find({
      status: "approved",
      isActive: true,
    })
      .select("_id name email phone")
      .sort({ name: 1 })
      .limit(500);

    return NextResponse.json(
      {
        success: true,
        data: partners,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching approved partners:", error);
    return jsonError("internal_error", 500);
  }
}
