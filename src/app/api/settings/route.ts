import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Setting from "@/models/Setting";

// GET settings
export async function GET() {
  await connectDB();
  try {
    // There should only be one settings document
    const settings = await Setting.findOne();
    if (!settings) {
      // If no settings exist, create a default one
      const defaultSettings = await Setting.create({});
      return NextResponse.json({ success: true, data: defaultSettings });
    }
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

// UPDATE settings
export async function POST(request: Request) {
  await connectDB();
  try {
    const body = await request.json();
    // Find one and update, or create if it doesn't exist (upsert)
    const settings = await Setting.findOneAndUpdate({}, body, {
      new: true,
      upsert: true,
      runValidators: true,
    });
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
