import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { Partner, type IPartnerDocument } from "@/features/partners/model";
import { mongoIdSchema } from "@/shared/schema/mongo-id";
import { connectDB } from "@/shared/db";
import { jsonError } from "@/shared/http/json-error";

type StoredDocument = IPartnerDocument & { _id?: { toString(): string } };

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
    const partner = await Partner.findById(id).select("documents");
    if (!partner) return jsonError("not_found", 404);

    const document = (partner.documents as StoredDocument[] | undefined)?.find(
      (item) => item._id?.toString() === documentId,
    );
    if (!document) return jsonError("not_found", 404);

    return NextResponse.json({
      success: true,
      data: {
        _id: document._id?.toString(),
        type: document.type,
        fileName: document.fileName,
        fileData: document.fileData,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
        status: document.status,
      },
    });
  } catch (error) {
    console.error("Error opening partner document:", error);
    return jsonError("internal_error", 500);
  }
}
