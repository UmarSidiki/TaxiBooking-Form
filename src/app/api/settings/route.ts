import { NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import { Setting } from "@/models/settings";

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
    const existing = await Setting.findOne();
    if (existing) {
      Object.assign(existing, body);
      await existing.save();
      return NextResponse.json({ success: true, message: "Settings saved successfully", data: existing });
    } else {
      const newSettings = new Setting(body);
      await newSettings.save();
      return NextResponse.json({ success: true, message: "Settings saved successfully", data: newSettings });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
