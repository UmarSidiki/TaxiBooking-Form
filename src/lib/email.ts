import nodemailer from "nodemailer";

export async function sendEmail(
  mailOptions: nodemailer.SendMailOptions
): Promise<boolean> {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      console.log("⚠️ SMTP not configured. Email sending skipped.");
      console.log("✉️ Would send email to:", mailOptions.to);
      return true;
    }

    const port = Number(process.env.SMTP_PORT) || 465;
    const isSecure = port === 465;
    
    // Check if SMTP_HOST is an IP address
    const isIPAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(process.env.SMTP_HOST);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // If connecting via IP address, we need to relax TLS certificate validation
      tls: isIPAddress ? {
        rejectUnauthorized: false, // Allow self-signed certificates or hostname mismatches
        servername: process.env.SMTP_SERVERNAME, // Optional: specify the expected server name
      } : undefined,
    });

    await transporter.sendMail(mailOptions);

    console.log("✅ Email sent to:", mailOptions.to);
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return false;
  }
}
