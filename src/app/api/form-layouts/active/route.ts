import { NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import { FormLayout } from "@/models/form-layout";

export async function GET() {
  try {
    await connectDB();
    // Find the default active layout
    let layout = await FormLayout.findOne({ isDefault: true, isActive: true });
    
    // Fallback: Find any active layout
    if (!layout) {
      layout = await FormLayout.findOne({ isActive: true }).sort({ updatedAt: -1 });
    }

    if (!layout) {
      // It's acceptable to return null if no layout is configured
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({ success: true, data: layout });
  } catch (error) {
    console.error("Error fetching active layout:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch active layout" },
      { status: 500 }
    );
  }
}
