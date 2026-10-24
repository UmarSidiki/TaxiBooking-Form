import { NextRequest, NextResponse } from "next/server";

import { requireRole } from "@/features/auth/lib/require-role";
import { Driver } from "@/features/drivers/model";
import { partnerDocumentSchema } from "@/features/partners/schema/partner-write.schema";
import { connectDB } from "@/shared/db";
import { jsonError } from "@/shared/http/json-error";
import { parseJsonBody } from "@/shared/http/parse-json-body";

export async function POST(request: NextRequest) {
  try {
    const access = await requireRole("driver");
    if (!access.ok) return access.response;

    const parsed = await parseJsonBody(request, partnerDocumentSchema);
    if (!parsed.ok) return parsed.response;

    await connectDB();
    const driver = await Driver.findById(access.session.user.id);
    if (!driver) return jsonError("not_found", 404);

    const allowed = ["license", "insurance", "registration", "id", "other"] as const;
    const type = allowed.find((item) => item === parsed.data.type);
    if (!type) return jsonError("invalid_body", 400);

    driver.documents = driver.documents ?? [];
    driver.documents.push({
      ...parsed.data,
      type,
      status: "pending",
      uploadedAt: new Date(),
    });
    await driver.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error uploading driver document:", error);
    return jsonError("internal_error", 500);
  }
}
