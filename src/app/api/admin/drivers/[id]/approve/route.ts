import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/features/auth/lib/require-role";
import { Driver } from "@/features/drivers/model";
import { connectDB } from "@/shared/db";
import { jsonError } from "@/shared/http/json-error";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id } = await params;
    await connectDB();
    const driver = await Driver.findById(id);
    if (!driver) return jsonError("not_found", 404);

    driver.status = "approved";
    driver.isActive = true;
    driver.approvedAt = new Date();
    driver.approvedBy = access.session.user.id;
    for (const doc of driver.documents ?? []) {
      if (doc.status === "pending") {
        doc.status = "approved";
        doc.reviewedAt = new Date();
        doc.reviewedBy = access.session.user.id;
      }
    }
    await driver.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error approving driver:", error);
    return jsonError("internal_error", 500);
  }
}
