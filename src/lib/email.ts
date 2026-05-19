import nodemailer from "nodemailer";
import { connectDB } from "@/lib/database";
import { Setting } from "@/models/settings";

export async function sendEmail(
  mailOptions: nodemailer.SendMailOptions
): Promise<boolean> {
  try {
    console.log("📧 Attempting to send email to:", mailOptions.to);
    console.log("📧 Email subject:", mailOptions.subject);

    let smtpConfig: {
      host: string;
      port: number;
      user: string;
      pass: string;
      encryption: 'TLS' | 'SSL' | 'none';
    };

    await connectDB();
    const settings = await Setting.findOne();

    if (settings && settings.smtpHost && settings.smtpUser) {
      smtpConfig = {
        host: settings.smtpHost,
        port: settings.smtpPort || 587,
        user: settings.smtpUser,
        pass: settings.smtpPass || '',
        encryption: settings.smtpEncryption || 'TLS',
      };
    } else {
      console.error("⚠️ SMTP not configured in settings. Email was NOT sent.");
      console.error("✉️ Intended recipient:", mailOptions.to);
      return false;
    }

    const isSecure = smtpConfig.encryption === 'SSL';
    const shouldRejectUnauthorized = smtpConfig.encryption !== 'none';
    const isIPAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(smtpConfig.host);

    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: isSecure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
      tls: isIPAddress ? {
        rejectUnauthorized: false,
        servername: process.env.SMTP_SERVERNAME,
      } : {
        rejectUnauthorized: shouldRejectUnauthorized,
      },
    });

    const result = await transporter.sendMail(mailOptions);
    console.log("📧 Email sent successfully:", result.messageId);
    transporter.close();

    return true;
  } catch (error) {
    console.error("❌ Error sending email to", mailOptions.to, ":", error);
    return false;
  }
}
