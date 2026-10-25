import { NextRequest, NextResponse } from "next/server";

import { registerDriver } from "@/features/drivers/lib/register-driver";
import { driverRegisterSchema } from "@/features/drivers/schema/driver-write.schema";
import { jsonError } from "@/shared/http/json-error";
import { limitSensitive } from "@/shared/http/sensitive-limit";
import { parseJsonBody } from "@/shared/http/parse-json-body";

export async function POST(request: NextRequest) {
  const limited = await limitSensitive(request, "login");
  if (limited) return limited;
  try {
    const parsed = await parseJsonBody(request, driverRegisterSchema);
    if (!parsed.ok) return parsed.response;

    const result = await registerDriver(parsed.data);
    if (!result.ok) {
      return result.reason === "conflict"
        ? jsonError("conflict", 409)
        : jsonError("forbidden", 403);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Driver register failed:", error);
    return jsonError("internal_error", 500);
  }
}
