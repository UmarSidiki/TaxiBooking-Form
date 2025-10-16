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

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail(mailOptions);

    console.log("✅ Email sent to:", mailOptions.to);
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return false;
  }
}
