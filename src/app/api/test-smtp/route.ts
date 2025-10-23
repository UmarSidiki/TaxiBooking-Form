import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Setting from "@/models/Setting";
import { sendEmail } from "@/lib/email";

export async function POST() {
  await connectDB();
  try {
    // Get SMTP settings
    const settings = await Setting.findOne();

    // Check if we have database settings
    const hasDatabaseConfig =
      settings && settings.smtpHost && settings.smtpUser;

    if (!hasDatabaseConfig) {
      return NextResponse.json(
        {
          success: false,
          message:
            "SMTP configuration incomplete. Please configure SMTP settings in the dashboard.",
        },
        { status: 400 }
      );
    }

    // Use database settings for the test email
    const smtpUser = settings.smtpUser;
    const testRecipient = settings.smtpTestEmail || smtpUser;
    const fromField = settings.smtpSenderName ? `${settings.smtpSenderName} <${smtpUser}>` : smtpUser;

    // Create test email options
    const testEmailOptions = {
      from: fromField,
      to: testRecipient,
      subject: "SMTP Test - Booking System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>SMTP Configuration Test</h2>
          <p>This is a test email to verify your SMTP configuration is working correctly.</p>
          <p><strong>Test sent at:</strong> ${new Date().toLocaleString()}</p>
          <p>If you received this email, your SMTP settings are configured properly!</p>
          <hr>
          <p style="color: #666; font-size: 12px;">This is an automated test email from your booking system.</p>
        </div>
      `,
      text: `SMTP Configuration Test

This is a test email to verify your SMTP configuration is working correctly.

Test sent at: ${new Date().toLocaleString()}

If you received this email, your SMTP settings are configured properly!

This is an automated test email from your booking system.`,
    };

    // Use the sendEmail function which handles SMTP config from settings or env
    const success = await sendEmail(testEmailOptions);

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Test email sent successfully! Check your inbox.",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "SMTP test failed. Check your SMTP configuration.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("SMTP test error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      {
        success: false,
        message: `SMTP test failed: ${message}`,
      },
      { status: 500 }
    );
  }
}
