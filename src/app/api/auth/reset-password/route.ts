import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { connectDB } from "@/lib/database";
import { User } from "@/models/user";
import { PasswordReset } from "@/models/user";

export async function POST(request: NextRequest) {
  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: "Email, OTP, and new password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find and verify OTP
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

    // Find user
    const user = await User.findOne({ email: resetRecord.email });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 10);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    // Mark OTP as used
    resetRecord.isUsed = true;
    await resetRecord.save();

    console.log("✅ Password reset successful for:", user.email);

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in reset-password:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
