import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import { User } from "@/models/user";
import { PasswordReset } from "@/models/user";
import { sendPasswordResetOTP } from "@/controllers/email/PasswordResetOTP";

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email address" },
        { status: 404 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing unused OTPs for this email
    await PasswordReset.deleteMany({ email: user.email, isUsed: false });

    // Create new OTP record
    await PasswordReset.create({
      email: user.email,
      otp,
      expiresAt,
      isUsed: false,
    });

    // Send OTP email
    const emailSent = await sendPasswordResetOTP({
      email: user.email,
      otp,
      name: user.name,
    });

    if (!emailSent) {
      return NextResponse.json(
        { error: "Failed to send OTP email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "If an account exists with this email, an OTP has been sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in request-reset:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
