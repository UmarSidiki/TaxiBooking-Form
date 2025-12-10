import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/database";
import { Partner } from "@/models/partner";
import { authOptions } from "@/lib/auth/options";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Get only approved and active partners
    const partners = await Partner.find({
      status: "approved",
      isActive: true,
    })
      .select("_id name email phone")
      .sort({ name: 1 });

    return NextResponse.json(
      {
        success: true,
        data: partners,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching approved partners:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An error occurred while fetching partners",
      },
      { status: 500 }
    );
  }
}
