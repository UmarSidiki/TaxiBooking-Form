import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { driverWorks } from "@/features/drivers/lib/driver-approval";
import { applyDriverRideAction } from "@/features/drivers/lib/apply-driver-ride-action";
import { driverRideActionSchema } from "@/features/drivers/schema/driver-ride-action.schema";
import { Driver } from "@/features/drivers/model";
import { requireRole } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";
import { creditPartnerAfterPayment } from "@/features/payments/lib/credit-partner-after-payment";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireRole("driver");
    if (!access.ok) return access.response;
    const parsed = driverRideActionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError("invalid_body", 400);

    await connectDB();
    const driver = await Driver.findById(access.session.user.id).select("status isActive");
    if (!driver || !driverWorks(driver.status) || driver.isActive === false) {
      return jsonError("forbidden", 403);
    }

    const { id } = await params;
    const updated = await applyDriverRideAction(access.session.user.id, id, parsed.data);
    if (!updated) return jsonError("not_found", 404);
    if (parsed.data.action === "completed") {
      await creditPartnerAfterPayment(updated);
    }
    return NextResponse.json({ success: true, driverRideStatus: updated.driverRideStatus });
  } catch (error) {
    console.error("Driver ride action failed:", error);
    return jsonError("internal_error", 500);
  }
}
