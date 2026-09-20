import { NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Setting } from "@/features/settings/model";
import { sendEmail } from "@/features/settings/lib/email";
import { requireAdmin } from "@/features/auth/lib/require-role";
import { jsonError } from "@/shared/http/json-error";

export async function POST() {
  const access = await requireAdmin();
  if (!access.ok) return access.response;

  await connectDB();
  try {
    const settings = await Setting.findOne();
    const hasDatabaseConfig =
      settings && settings.smtpHost && settings.smtpUser;

    if (!hasDatabaseConfig) {
      return jsonError("smtp_not_configured", 400);
    }

    const smtpUser = settings.smtpUser;
    const testRecipient = settings.smtpTestEmail || smtpUser;
    const fromField = settings.smtpSenderName
      ? `${settings.smtpSenderName} <${smtpUser}>`
      : smtpUser;

    const success = await sendEmail({
      from: fromField,
      to: testRecipient,
      subject: "SMTP Test - Booking System",
      html: `<div><h2>SMTP Configuration Test</h2><p>This is a test email to verify your SMTP configuration is working correctly.</p><p>Test sent at: ${new Date().toISOString()}</p></div>`,
      text: `SMTP Configuration Test\n\nTest sent at: ${new Date().toISOString()}`,
    });

    if (!success) return jsonError("smtp_failed", 500);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SMTP test error:", error);
    return jsonError("smtp_failed", 500);
  }
}
