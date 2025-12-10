import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import { PasswordReset } from "@/models/user";

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find valid OTP
    const resetRecord = await PasswordReset.findOne({
      email: email.toLowerCase().trim(),
      otp: otp.trim(),
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // OTP is valid - return success
    // Don't mark as used yet, wait for password reset
    return NextResponse.json(
      { message: "OTP verified successfully", valid: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in verify-otp:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
