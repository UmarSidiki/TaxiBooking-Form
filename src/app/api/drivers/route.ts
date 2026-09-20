import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/shared/db";
import { Driver } from "@/features/drivers/model";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { parseJsonBody } from "@/shared/http/parse-json-body";
import { jsonError } from "@/shared/http/json-error";
import { driverCreateSchema } from "@/features/drivers/schema/driver-write.schema";

export async function GET(request: NextRequest) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    await connectDB();
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");
    const filter = isActive !== null ? { isActive: isActive === "true" } : {};
    const drivers = await Driver.find(filter)
      .sort({ createdAt: -1 })
      .select("-password");

    return NextResponse.json({ success: true, data: drivers });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return jsonError("internal_error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const parsed = await parseJsonBody(request, driverCreateSchema);
    if (!parsed.ok) return parsed.response;

    await connectDB();
    const existingDriver = await Driver.findOne({ email: parsed.data.email });
    if (existingDriver) return jsonError("conflict", 400);

    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
    const driver = await Driver.create({
      ...parsed.data,
      password: hashedPassword,
    });
    const driverResponse = { ...driver.toObject() };
    delete driverResponse.password;

    return NextResponse.json(
      { success: true, data: driverResponse },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating driver:", error);
    return jsonError("internal_error", 500);
  }
}
