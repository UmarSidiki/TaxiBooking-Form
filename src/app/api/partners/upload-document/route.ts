import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/database";
import { Partner } from "@/models/partner";
import { authOptions } from "@/lib/auth/options";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "partner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, fileName, fileData, mimeType, fileSize } =
      await request.json();

    if (!type || !fileName || !fileData || !mimeType || !fileSize) {
      return NextResponse.json(
        {
          error:
            "Document type, file name, file data, mime type, and file size are required",
        },
        { status: 400 }
      );
    }

    // Validate mime type
    const allowedMimeTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (!allowedMimeTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: "Only PDF, JPG, and PNG files are allowed" },
        { status: 400 }
      );
    }

    // Validate base64 data
    if (!fileData.startsWith("data:")) {
      return NextResponse.json(
        { error: "Invalid file data format" },
        { status: 400 }
      );
    }

    await connectDB();

    const partner = await Partner.findById(session.user.id);

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    // Add document to partner's documents array
    partner.documents.push({
      type,
      fileName,
      fileData,
      mimeType,
      fileSize,
      status: "pending",
      uploadedAt: new Date(),
    });

    await partner.save();

    return NextResponse.json(
      { message: "Document uploaded successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { error: "An error occurred while uploading document" },
      { status: 500 }
    );
  }
}
