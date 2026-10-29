import { prepareEventEmail, sendPreparedEmail } from "@/features/emails/lib/send-event-email";
import { OtpEmail } from "@/features/emails/templates/otp-email";

interface OTPData {
  email: string;
  otp: string;
  name?: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function sendPasswordResetOTP(otpData: OTPData) {
  try {
    if (!otpData.email || !isValidEmail(otpData.email)) {
      console.error("Invalid email address:", otpData.email);
      return false;
    }

    const prepared = await prepareEventEmail({
      event: "password_reset_otp",
      audience: "customer",
      locale: "en",
      values: { code: otpData.otp, name: otpData.name ?? "" },
    });
    if (!prepared) return false;

    return sendPreparedEmail({
      prepared,
      to: otpData.email,
      element: (
        <OtpEmail
          t={prepared.t}
          brand={prepared.brand}
          locale={prepared.locale}
          subject={prepared.copy.subject}
          intro={prepared.copy.intro}
          code={otpData.otp}
        />
      ),
    });
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return false;
  }
}
