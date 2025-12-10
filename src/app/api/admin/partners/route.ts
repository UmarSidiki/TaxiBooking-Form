import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/database";
import { Partner } from "@/models/partner";
import { authOptions } from "@/lib/auth/options";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const query = status ? { status } : {};
    const partners = await Partner.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    return NextResponse.json(
      { partners },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching partners:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching partners" },
      { status: 500 }
    );
  }
}
