import { sendEmail } from "@/lib/email";
import { connectDB } from "@/lib/database";
import { Setting } from "@/models/settings";

interface OTPData {
  email: string;
  otp: string;
  name?: string;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generateEmailHTML(otpData: OTPData) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Password Reset - OTP Verification</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #fef3c7; padding: 20px; border-radius: 5px; margin-bottom: 20px; text-align: center; }
    .header h1 { margin: 0; color: #92400e; }
    .otp-box { background-color: #f0f9ff; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0; }
    .otp-code { font-size: 32px; font-weight: bold; color: #0369a1; letter-spacing: 8px; margin: 10px 0; }
    .warning { background-color: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc2626; }
    .footer { color: #718096; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Password Reset Request</h1>
    </div>

    <p>Hello${otpData.name ? ` ${otpData.name}` : ''},</p>
    
    <p>We received a request to reset your password. Use the following One-Time Password (OTP) to complete the process:</p>

    <div class="otp-box">
      <p style="margin: 0; color: #64748b; font-size: 14px;">Your OTP Code</p>
      <div class="otp-code">${otpData.otp}</div>
      <p style="margin: 0; color: #64748b; font-size: 12px;">This code will expire in 10 minutes</p>
    </div>

    <div class="warning">
      <p style="margin: 0;"><strong>⚠️ Security Notice:</strong></p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>Never share this OTP with anyone</li>
        <li>Our team will never ask for your OTP</li>
        <li>If you didn't request this, please ignore this email</li>
      </ul>
    </div>

    <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>

    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
      <p>© ${new Date().getFullYear()} Admin Portal. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendPasswordResetOTP(otpData: OTPData) {
  try {
    if (!otpData.email || !isValidEmail(otpData.email)) {
      console.error("❌ Invalid email address:", otpData.email);
      return false;
    }

    console.log("📧 Preparing password reset OTP email for:", otpData.email);

    await connectDB();
    const settings = await Setting.findOne();
    const fromAddress = settings?.smtpFrom || settings?.smtpUser;
    const fromField = settings?.smtpSenderName ? `${settings.smtpSenderName} <${fromAddress}>` : fromAddress;

    const htmlContent = generateEmailHTML(otpData);

    const success = await sendEmail({
      from: fromField,
      to: otpData.email,
      subject: "Password Reset - OTP Verification",
      html: htmlContent,
      text: `Password Reset Request\n\nYour OTP code is: ${otpData.otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.`,
    });

    if (!success) {
      console.error("❌ Failed to send OTP email to:", otpData.email);
      return false;
    }

    console.log("✅ OTP email sent to:", otpData.email);
    return true;
  } catch (error) {
    console.error("❌ Error sending OTP email:", error);
    return false;
  }
}
