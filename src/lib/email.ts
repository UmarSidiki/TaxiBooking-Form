import nodemailer from "nodemailer";
import { connectDB } from "@/lib/mongoose";
import Setting from "@/models/Setting";

export async function sendEmail(
  mailOptions: nodemailer.SendMailOptions
): Promise<boolean> {
  try {
    // Add debug logging
    console.log("📧 Attempting to send email to:", mailOptions.to);
    console.log("📧 Email subject:", mailOptions.subject);
    
    let smtpConfig: {
      host: string;
      port: number;
      user: string;
      pass: string;
      encryption: 'TLS' | 'SSL' | 'none';
    };

    // First, try to get SMTP config from database settings
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
    } else if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      // Fallback to environment variables if settings not configured
      smtpConfig = {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 465,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS || '',
        encryption: 'SSL', // Default for env-based config
      };
    } else {
      console.log("⚠️ SMTP not configured in settings or environment. Email sending skipped.");
      console.log("✉️ Would send email to:", mailOptions.to);
      return true;
    }

    const isSecure = smtpConfig.encryption === 'SSL';
    const shouldRejectUnauthorized = smtpConfig.encryption !== 'none';

    // Check if SMTP_HOST is an IP address
    const isIPAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(smtpConfig.host);

    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: isSecure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
      // If connecting via IP address, we need to relax TLS certificate validation
      tls: isIPAddress ? {
        rejectUnauthorized: false, // Allow self-signed certificates or hostname mismatches
        servername: process.env.SMTP_SERVERNAME, // Optional: specify the expected server name
      } : {
        rejectUnauthorized: shouldRejectUnauthorized,
      },
    });

    const result = await transporter.sendMail(mailOptions);
    console.log("📧 Email sent successfully:", result.messageId);
    
    // Close the transporter to free up resources in serverless environments
    transporter.close();

    return true;
  } catch (error) {
    console.error("❌ Error sending email to", mailOptions.to, ":", error);
    return false;
  }
}