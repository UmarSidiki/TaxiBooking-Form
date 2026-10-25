import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { driverWorks } from "@/features/drivers/lib/driver-approval";
import { listDriverRides } from "@/features/drivers/lib/list-driver-rides";
import { driverRidesQuerySchema } from "@/features/drivers/schema/driver-rides-query.schema";
import { Driver } from "@/features/drivers/model";
import { requireRole } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

export async function GET(request: NextRequest) {
  try {
    const access = await requireRole("driver");
    if (!access.ok) return access.response;

    const parsed = driverRidesQuerySchema.safeParse({
      from: request.nextUrl.searchParams.get("from") ?? undefined,
      to: request.nextUrl.searchParams.get("to") ?? undefined,
      afterDate: request.nextUrl.searchParams.get("afterDate") ?? undefined,
      afterTime: request.nextUrl.searchParams.get("afterTime") ?? undefined,
      afterId: request.nextUrl.searchParams.get("afterId") ?? undefined,
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });
    if (!parsed.success) return jsonError("invalid_body", 400);

    await connectDB();
    const driver = await Driver.findById(access.session.user.id).select("status isActive");
    if (!driver || !driverWorks(driver.status) || driver.isActive === false) {
      return jsonError("forbidden", 403);
    }

    const page = await listDriverRides(access.session.user.id, parsed.data);
    return NextResponse.json({
      success: true,
      data: page.data,
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
    });
  } catch (error) {
    console.error("Error fetching driver rides:", error);
    return jsonError("internal_error", 500);
  }
}
