import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { connectDB } from "@/lib/database";
import { Partner } from "@/models/partner";
import { authOptions } from "@/lib/auth/options";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const partner = await Partner.findById(id);

    if (!partner) {
      return NextResponse.json({ success: false, error: "Partner not found" }, { status: 404 });
    }

    partner.payoutBalance = 0;
    partner.lastPayoutAt = new Date();
    await partner.save();

    return NextResponse.json(
      {
        success: true,
        partner,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error clearing partner payout balance:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear payout balance" },
      { status: 500 }
    );
  }
}
