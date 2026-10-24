import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/features/auth/lib/require-role";
import { Driver, type IDriverDocument } from "@/features/drivers/model";
import { mongoIdSchema } from "@/shared/schema/mongo-id";
import { connectDB } from "@/shared/db";
import { jsonError } from "@/shared/http/json-error";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> },
) {
  try {
    const access = await requireAdmin();
    if (!access.ok) return access.response;

    const { id, documentId } = await params;
    if (!mongoIdSchema.safeParse(id).success || !mongoIdSchema.safeParse(documentId).success) {
      return jsonError("invalid_body", 400);
    }

    await connectDB();
    const driver = await Driver.findById(id).select("documents");
    if (!driver) return jsonError("not_found", 404);

    const document = driver.documents?.find(
      (item: IDriverDocument) => item._id?.toString() === documentId,
    );
    if (!document) return jsonError("not_found", 404);

    return NextResponse.json({
      success: true,
      data: {
        type: document.type,
        fileName: document.fileName,
        fileData: document.fileData,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
        status: document.status,
      },
    });
  } catch (error) {
    console.error("Error opening driver document:", error);
    return jsonError("internal_error", 500);
  }
}
