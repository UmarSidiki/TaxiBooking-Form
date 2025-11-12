import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/database";
import { Partner } from "@/models/partner";
import { authOptions } from "@/lib/auth/options";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "partner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const partner = await Partner.findById(session.user.id).select("-password");

    if (!partner) {
      return NextResponse.json(
        { success: false, error: "Partner not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, partner }, { status: 200 });
  } catch (error) {
    console.error("Error fetching partner profile:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while fetching profile" },
      { status: 500 }
    );
  }
}
