import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import DriverTimeOff from "@/features/drivers/model/DriverTimeOff";
import { driverTimeOffSchema } from "@/features/drivers/schema/driver-time-off.schema";
import { requireRole } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

export async function GET() {
  try {
    const access = await requireRole("driver");
    if (!access.ok) return access.response;
    await connectDB();
    const items = await DriverTimeOff.find({ driverId: access.session.user.id })
      .sort({ startsAt: 1 })
      .limit(100)
      .lean();
    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("Driver time off list failed:", error);
    return jsonError("internal_error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireRole("driver");
    if (!access.ok) return access.response;
    const parsed = driverTimeOffSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError("invalid_body", 400);
    await connectDB();
    const created = await DriverTimeOff.create({
      driverId: access.session.user.id,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: new Date(parsed.data.endsAt),
      note: parsed.data.note,
    });
    return NextResponse.json({ success: true, id: String(created._id) }, { status: 201 });
  } catch (error) {
    console.error("Driver time off create failed:", error);
    return jsonError("internal_error", 500);
  }
}
