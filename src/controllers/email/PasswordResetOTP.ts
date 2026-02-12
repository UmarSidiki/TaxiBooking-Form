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
    body { font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background-color: #f0f9ff; padding: 15px; border-left: 4px solid #0369a1; margin-bottom: 20px; }
    .header h1 { margin: 0 0 5px 0; font-size: 18px; color: #0369a1; }
    .otp-box { background-color: #f0f9ff; padding: 15px; margin: 20px 0; text-align: center; border-left: 3px solid #0369a1; }
    .otp-code { font-size: 32px; font-weight: bold; color: #0369a1; letter-spacing: 8px; margin: 10px 0; }
    .warning { background-color: #fee2e2; padding: 12px; border-left: 3px solid #dc2626; margin: 20px 0; color: #991b1b; }
    .footer { font-size: 12px; color: #999; margin-top: 25px; border-top: 1px solid #ddd; padding-top: 15px; }
    a { color: #0369a1; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>

    <p>Hello${otpData.name ? ` ${otpData.name}` : ''},</p>
    
    <p>We received a request to reset your password. Use the following One-Time Password (OTP) to complete the process:</p>

    <div class="otp-box">
      <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px;">Your OTP Code (expires in 10 minutes)</p>
      <div class="otp-code">${otpData.otp}</div>
    </div>

    <div class="warning">
      <p style="margin: 0 0 8px 0;"><strong>Security Notice:</strong></p>
      <ul style="margin: 0; padding-left: 20px;">
        <li>Never share this OTP with anyone</li>
        <li>Our team will never ask for your OTP</li>
        <li>If you didn't request this, please ignore this email</li>
      </ul>
    </div>

    <p>If you didn't request a password reset, your password will remain unchanged.</p>

    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} Booking Service. All rights reserved.</p>
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
